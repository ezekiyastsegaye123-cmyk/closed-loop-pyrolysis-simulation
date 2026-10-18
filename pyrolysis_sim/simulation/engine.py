"""
Integrated Closed-Loop Reactor Simulator.
Couples kinetics, sensible heat carriers, byproduct combustion, and control logic.
"""

from typing import Dict, List, Any
import numpy as np
from pyrolysis_sim.config import (
    T_AMB,
    T_PYRO_NOMINAL,
    TAU_VAPOR_OPTIMAL,
    BENCHMARK_FEED_MASS,
    BENCHMARK_ASH_MASS,
    CP_BIOMASS_A,
)
from pyrolysis_sim.kinetics.biomass import BiomassKinetics
from pyrolysis_sim.kinetics.catalytic import CatalyticReactions
from pyrolysis_sim.thermodynamics.balances import total_reactor_heat_requirement
from pyrolysis_sim.thermodynamics.heat_carrier import HeatCarrierSystem
from pyrolysis_sim.control.pid import PIDController
from pyrolysis_sim.control.fuzzy import FuzzySupervisor


class ClosedLoopReactorSimulation:
    """
    Simulates the dynamic closed-loop pyrolysis process over time steps:
    - Biomass feed input
    - Primary pyrolysis decomposition
    - Secondary char-catalyzed vapor cracking & syngas HDO
    - Ash heat carrier recirculation & heat delivery
    - Byproduct combustion for ash reheating
    - Feedback control tracking setpoint temperature
    """

    def __init__(
        self,
        feed_mass_rate: float = 1000.0,  # kg/hr or batch 1000 kg basis
        t_setpoint: float = T_PYRO_NOMINAL,
        char_catalysis: bool = True,
        syngas_recirc: bool = True,
    ):
        self.feed_rate = feed_mass_rate
        self.t_setpoint = t_setpoint
        self.kinetics = BiomassKinetics()
        self.catalytic = CatalyticReactions(char_catalysis, syngas_recirc)
        self.heat_carrier = HeatCarrierSystem()
        self.pid = PIDController(kp=1.5, ki=0.08, kd=0.3, output_min=0.0, output_max=100.0)
        self.fuzzy = FuzzySupervisor()

    def run_transient(
        self,
        duration_seconds: float = 600.0,
        dt: float = 2.0,
        initial_temp: float = 350.0 + 273.15, # warm pre-heated reactor
    ) -> Dict[str, Any]:
        """
        Runs transient time simulation from initial_temp to steady state.
        """
        time_steps = int(duration_seconds / dt)
        times = []
        temps = []
        char_yields = []
        biooil_yields = []
        gas_yields = []
        syngas_recirc_ratios = []
        trim_fuel_rates = []
        thermal_efficiencies = []
        autothermal_margins = []

        current_T = initial_temp
        prev_error = self.t_setpoint - current_T

        # Typical heating values: Syngas ~ 12 MJ/kg, Char ~ 22 MJ/kg
        lhv_syngas = 12.0e6
        lhv_char = 22.0e6

        for step in range(time_steps):
            t = step * dt
            times.append(t)
            temps.append(current_T)

            # 1. Error dynamics for controller
            error = self.t_setpoint - current_T
            d_error = (error - prev_error) / dt if dt > 0 else 0.0
            prev_error = error

            # 2. Control decision: Fuzzy logic supervisory setpoints
            rec_ratio, trim_fuel_pct = self.fuzzy.evaluate(error, d_error)
            pid_effort = self.pid.compute(self.t_setpoint, current_T, dt)
            
            # Combine trim fuel with PID effort during heating
            trim_fuel_kg = (trim_fuel_pct / 100.0) * 25.0 * (dt / 3600.0)

            # 3. Primary Kinetics at current_T (residence time tau = 3s)
            primary = self.kinetics.primary_yields(current_T, tau=TAU_VAPOR_OPTIMAL)

            # 4. Secondary Catalytic Reactions
            secondary = self.catalytic.secondary_cracking(
                primary["primary_vapors"],
                T_bed=800.0 + 273.15,
                tau_vapor=1.5
            )

            # 5. Syngas HDO upgrade
            hdo = self.catalytic.syngas_hydrodeoxygenation(
                secondary["retained_bio_oil"],
                syngas_recirc_ratio=rec_ratio
            )

            final_biooil = hdo["upgraded_bio_oil"]
            final_gas = primary["primary_gas"] + secondary["secondary_gas"]
            final_char = primary["primary_char"] + secondary["secondary_char"]

            char_yields.append(final_char * 100.0)
            biooil_yields.append(final_biooil * 100.0)
            gas_yields.append(final_gas * 100.0)
            syngas_recirc_ratios.append(rec_ratio)
            trim_fuel_rates.append(trim_fuel_pct)

            # 6. Thermal balances
            heat_req = total_reactor_heat_requirement(
                feed_mass=self.feed_rate * (dt / 3600.0),
                T_pyro=current_T,
                secondary_cracked_mass=secondary["cracked_vapors"] * self.feed_rate * (dt / 3600.0)
            )

            # Sensible heat delivery from recirculating ash
            ash_heat = self.heat_carrier.heat_delivered_by_carrier(
                feed_mass=self.feed_rate * (dt / 3600.0),
                T_pyro_target=current_T
            )

            # Closed loop byproduct combustion performance
            perf = self.heat_carrier.autothermal_performance(
                feed_mass=self.feed_rate,
                q_reactor_required=heat_req["total_reactor_heat_required_joules"],
                byproduct_syngas_heating_val=lhv_syngas,
                byproduct_syngas_mass=final_gas * self.feed_rate * (1.0 - rec_ratio),
                byproduct_char_heating_val=lhv_char,
                byproduct_char_mass=final_char * self.feed_rate * 0.70, # 70% char used for combustion
                supplementary_lpg_kg=trim_fuel_kg
            )

            thermal_efficiencies.append(perf["thermal_efficiency_percent"])
            autothermal_margins.append(perf["autothermal_surplus_deficit_MJ"])

            # 7. Reactor temperature ODE step:
            # Heat capacity of reactor bed + ash mass
            c_bed = (self.feed_rate * 0.2 * CP_BIOMASS_A) + (BENCHMARK_ASH_MASS * 0.1 * 950.0)
            net_q_rate = (ash_heat["heat_delivered_joules"] - heat_req["total_reactor_heat_required_joules"]) / dt
            # Influence of PID and trim fuel
            net_q_rate += (pid_effort / 100.0) * 1.5e5 + (trim_fuel_pct / 100.0) * 3.0e5

            dT_dt = net_q_rate / c_bed
            # Clamp dT_dt to physically realistic rates (-5 to +10 K/s)
            dT_dt = max(-5.0, min(10.0, dT_dt))
            current_T += dT_dt * dt

        return {
            "time_s": times,
            "temperature_C": [temp - 273.15 for temp in temps],
            "bio_oil_yield_pct": biooil_yields,
            "char_yield_pct": char_yields,
            "gas_yield_pct": gas_yields,
            "syngas_recycle_ratio": syngas_recirc_ratios,
            "trim_fuel_pct": trim_fuel_rates,
            "thermal_efficiency_pct": thermal_efficiencies,
            "autothermal_margin_MJ": autothermal_margins,
            "steady_state_summary": {
                "final_temp_C": temps[-1] - 273.15,
                "final_bio_oil_yield_pct": biooil_yields[-1],
                "final_char_yield_pct": char_yields[-1],
                "final_gas_yield_pct": gas_yields[-1],
                "final_syngas_recycle_ratio": syngas_recirc_ratios[-1],
                "final_thermal_efficiency_pct": thermal_efficiencies[-1],
                "final_autothermal_margin_MJ": autothermal_margins[-1],
                "autothermal_achieved": autothermal_margins[-1] >= 0,
            }
        }

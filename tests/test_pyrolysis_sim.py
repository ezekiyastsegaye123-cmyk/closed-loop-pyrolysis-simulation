"""
Unit tests validating physics and kinetics against paper benchmarks.
"""

import pytest
from pyrolysis_sim.config import (
    BENCHMARK_THERMAL_EFFICIENCY,
    BENCHMARK_ASH_MASS,
    BENCHMARK_FEED_MASS,
    T_PYRO_NOMINAL,
)
from pyrolysis_sim.kinetics.biomass import BiomassKinetics
from pyrolysis_sim.kinetics.catalytic import CatalyticReactions
from pyrolysis_sim.thermodynamics.balances import total_reactor_heat_requirement
from pyrolysis_sim.thermodynamics.heat_carrier import HeatCarrierSystem
from pyrolysis_sim.control.pid import PIDController
from pyrolysis_sim.control.fuzzy import FuzzySupervisor
from pyrolysis_sim.simulation.engine import ClosedLoopReactorSimulation


def test_biomass_kinetics_primary_yields():
    kinetics = BiomassKinetics()
    # At nominal 500 °C (773.15 K) and tau = 3s
    yields = kinetics.primary_yields(T=500.0 + 273.15, tau=3.0)
    assert yields["conversion"] > 0.85
    assert yields["primary_vapors"] > 0.40
    assert yields["primary_char"] > 0.15
    assert yields["primary_gas"] > 0.10


def test_char_catalysis_and_syngas_hdo():
    catalytic = CatalyticReactions(char_catalysis_enabled=True, syngas_recirculation_enabled=True)
    # At 800 °C bed
    cracked = catalytic.secondary_cracking(primary_vapors=0.55, T_bed=800.0 + 273.15, tau_vapor=1.5)
    assert cracked["cracking_extent"] > 0.10
    assert cracked["retained_bio_oil"] < 0.55
    assert cracked["secondary_gas"] > 0.0

    # Syngas HDO
    hdo = catalytic.syngas_hydrodeoxygenation(bio_oil_fraction=0.45, syngas_recirc_ratio=0.5)
    assert hdo["hdo_efficiency"] > 0.0
    assert hdo["upgraded_bio_oil"] <= 0.45


def test_heat_carrier_autothermal_benchmark():
    carrier = HeatCarrierSystem()
    perf = carrier.autothermal_performance(
        feed_mass=BENCHMARK_FEED_MASS,
        q_reactor_required=1.0e9,
        byproduct_syngas_heating_val=12.0e6,
        byproduct_syngas_mass=150.0,
        byproduct_char_heating_val=22.0e6,
        byproduct_char_mass=200.0,
        supplementary_lpg_kg=0.0,
    )
    # Check that thermal efficiency matches paper 73.6%
    assert abs(perf["thermal_efficiency_percent"] - BENCHMARK_THERMAL_EFFICIENCY) < 0.1
    assert perf["is_autothermal"] is True


def test_pid_and_fuzzy_control():
    pid = PIDController(kp=2.0, ki=0.1, kd=0.5)
    out = pid.compute(setpoint=773.15, measured=700.0, dt=1.0)
    assert out > 0.0

    fuzzy = FuzzySupervisor()
    recycle_ratio, trim_fuel = fuzzy.evaluate(error=50.0, d_error=0.0)
    # Should demand high trim fuel when reactor is 50K below setpoint
    assert trim_fuel > 50.0

    # At steady state (error ~ 0)
    rec_ratio_ss, trim_ss = fuzzy.evaluate(error=0.0, d_error=0.0)
    assert trim_ss == 0.0
    assert 0.4 <= rec_ratio_ss <= 0.6


def test_integrated_closed_loop_simulation():
    sim = ClosedLoopReactorSimulation(feed_mass_rate=1000.0, t_setpoint=T_PYRO_NOMINAL)
    res = sim.run_transient(duration_seconds=60.0, dt=5.0)
    summary = res["steady_state_summary"]
    assert "final_temp_C" in summary
    assert summary["final_thermal_efficiency_pct"] == pytest.approx(BENCHMARK_THERMAL_EFFICIENCY, rel=1e-2)

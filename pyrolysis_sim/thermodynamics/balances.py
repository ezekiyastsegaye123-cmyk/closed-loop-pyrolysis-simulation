"""
Mass and enthalpy balance calculations (Section 3.1 & 3.2).
Formulates equation (1):
Q_total = int_{T_amb}^{T_pyro} Cp(T) dT + Delta H_rxn
"""

from typing import Dict
from pyrolysis_sim.config import (
    T_AMB,
    CP_BIOMASS_A,
    CP_BIOMASS_B,
    CP_ASH,
    CP_SYNGAS,
    CP_VAPOR,
    DELTA_H_PRIMARY_NOMINAL,
    DELTA_H_SECONDARY,
)


def sensible_heat_biomass(T_start: float, T_end: float, mass: float) -> float:
    """
    Computes sensible heat required to raise biomass from T_start to T_end [J]:
    integral_{T_start}^{T_end} (CP_BIOMASS_A + CP_BIOMASS_B * T) dT * mass
    """
    integral = (CP_BIOMASS_A * (T_end - T_start) + 
                0.5 * CP_BIOMASS_B * (T_end**2 - T_start**2))
    return integral * mass


def total_reactor_heat_requirement(
    feed_mass: float,
    T_pyro: float,
    T_feed: float = T_AMB,
    delta_h_rxn: float = DELTA_H_PRIMARY_NOMINAL,
    secondary_cracked_mass: float = 0.0,
) -> Dict[str, float]:
    """
    Total reactor thermal requirement [J] based on Equation (1):
    Q_total = Q_sensible + Q_reaction - Q_secondary_exothermic
    """
    q_sensible = sensible_heat_biomass(T_feed, T_pyro, feed_mass)
    q_primary_rxn = feed_mass * delta_h_rxn
    # Secondary cracking is exothermic, releasing heat and lowering net external requirement
    q_secondary_rxn = secondary_cracked_mass * DELTA_H_SECONDARY  # negative value

    q_net_reactor = q_sensible + q_primary_rxn + q_secondary_rxn

    return {
        "sensible_heat_joules": q_sensible,
        "primary_reaction_enthalpy_joules": q_primary_rxn,
        "secondary_cracking_enthalpy_joules": q_secondary_rxn,
        "total_reactor_heat_required_joules": q_net_reactor,
        "total_reactor_heat_required_MJ": q_net_reactor / 1e6,
    }

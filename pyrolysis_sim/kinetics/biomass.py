"""
Biomass primary pyrolysis decomposition kinetics based on the lumped
mechanism and Semyonov radical decomposition principles (Sections 2.1 & 2.2).
"""

import math
from typing import Dict, Tuple
from pyrolysis_sim.config import R_GAS, KINETIC_PARAMS, DEFAULT_BIOMASS_COMPOSITION


def arrhenius_rate(A: float, Ea: float, T: float) -> float:
    """Calculate reaction rate constant k(T) = A * exp(-Ea / (R * T))."""
    if T <= 0:
        return 0.0
    return A * math.exp(-Ea / (R_GAS * T))


class BiomassKinetics:
    """
    Lumped primary pyrolysis kinetic model for biomass pseudo-components:
    - Hemicellulose -> Vapors (acids, furans, light oxygenates), CO2, Char
    - Cellulose -> Levoglucosan, LMWPs (Condensable bio-oil vapors), Gas, Char
    - Lignin -> Phenols, Biochar, Gas (H2, CO, CH4)
    """

    def __init__(self, composition: Dict[str, float] = None):
        self.composition = composition or DEFAULT_BIOMASS_COMPOSITION.copy()

    def get_rate_constants(self, T: float) -> Dict[str, float]:
        """Compute rate constants [1/s] for each pseudo-component at temperature T [K]."""
        rates = {}
        for comp in ["hemicellulose", "cellulose", "lignin"]:
            p = KINETIC_PARAMS[comp]
            rates[comp] = arrhenius_rate(p["A"], p["Ea"], T)
        return rates

    def primary_yields(self, T: float, tau: float) -> Dict[str, float]:
        """
        Compute primary pyrolysis yields (mass fractions of original feed)
        at temperature T [K] and solid residence time tau [s].
        
        Returns dict with:
          - conversion: total biomass converted [0..1]
          - primary_char: solid char mass fraction
          - primary_vapors: condensable bio-oil precursor mass fraction
          - primary_gas: non-condensable syngas mass fraction
        """
        rates = self.get_rate_constants(T)

        char_yield = 0.0
        vapors_yield = 0.0
        gas_yield = 0.0
        unconverted = 0.0

        for comp, frac in self.composition.items():
            k = rates[comp]
            # First-order decomposition: X_i = 1 - exp(-k * tau)
            x_i = 1.0 - math.exp(-k * tau) if tau > 0 else 0.0
            unconverted_i = frac * (1.0 - x_i)
            reacted_i = frac * x_i

            unconverted += unconverted_i

            # Product branching ratios based on paper Section 2.1 & Table 1
            if comp == "hemicellulose":
                # High gas (CO2, CO) and light oxygenates
                char_yield += reacted_i * 0.20
                vapors_yield += reacted_i * 0.45
                gas_yield += reacted_i * 0.35
            elif comp == "cellulose":
                # High bio-oil yield (levoglucosan)
                char_yield += reacted_i * 0.10
                vapors_yield += reacted_i * 0.75
                gas_yield += reacted_i * 0.15
            elif comp == "lignin":
                # High char yield and phenolic compounds
                char_yield += reacted_i * 0.45
                vapors_yield += reacted_i * 0.35
                gas_yield += reacted_i * 0.20

        total_reacted = 1.0 - unconverted
        return {
            "conversion": total_reacted,
            "unreacted_biomass": unconverted,
            "primary_char": char_yield,
            "primary_vapors": vapors_yield,
            "primary_gas": gas_yield,
        }

"""
Secondary reactions: Char-catalyzed vapor cracking and Syngas-mediated
hydrodeoxygenation (HDO) (Sections 4.1 & 4.2).
"""

import math
from typing import Dict
from pyrolysis_sim.config import R_GAS, KINETIC_PARAMS, T_CHAR_NOMINAL


class CatalyticReactions:
    """
    Models:
    1. Char-catalyzed cracking of heavy bio-oil vapors / tars into light syngas (H2, CO, CH4).
       Accelerated by inherent AAEM (alkali/alkaline earth metals) in hot char bed (700 - 900 °C).
    2. In situ Hydrodeoxygenation (HDO) promoted by recycled syngas (H2, CO atmosphere).
    """

    def __init__(self, char_catalysis_enabled: bool = True, syngas_recirculation_enabled: bool = True):
        self.char_catalysis = char_catalysis_enabled
        self.syngas_recirc = syngas_recirculation_enabled

    def secondary_cracking(self, primary_vapors: float, T_bed: float, tau_vapor: float) -> Dict[str, float]:
        """
        Calculates secondary cracking of bio-oil vapors into light syngas and secondary char.
        tau_vapor: vapor residence time [s] in the hot zone.
        """
        if self.char_catalysis and T_bed >= 700.0 + 273.15:
            params = KINETIC_PARAMS["secondary_cracking_char_catalyzed"]
        else:
            params = KINETIC_PARAMS["secondary_cracking_uncatalyzed"]

        k_crack = params["A"] * math.exp(-params["Ea"] / (R_GAS * T_bed))
        
        # Fraction of primary vapors cracked: X = 1 - exp(-k * tau)
        x_crack = 1.0 - math.exp(-k_crack * tau_vapor)
        cracked_mass = primary_vapors * x_crack

        # Cracked vapors split into secondary gas (~85%) and secondary refractory char (~15%)
        sec_gas = cracked_mass * 0.85
        sec_char = cracked_mass * 0.15
        remaining_biooil_vapors = primary_vapors - cracked_mass

        return {
            "retained_bio_oil": remaining_biooil_vapors,
            "cracked_vapors": cracked_mass,
            "secondary_gas": sec_gas,
            "secondary_char": sec_char,
            "cracking_extent": x_crack,
        }

    def syngas_hydrodeoxygenation(self, bio_oil_fraction: float, syngas_recirc_ratio: float) -> Dict[str, float]:
        """
        Models in situ hydrodeoxygenation (HDO) and decarbonylation.
        Recycling syngas increases H2/CO partial pressures, reducing oxygenated tar content
        and upgrading bio-oil energy density / stability.
        
        syngas_recirc_ratio: fraction of non-condensable syngas recycled back to reactor [0..1].
        """
        if not self.syngas_recirc or syngas_recirc_ratio <= 0:
            return {
                "upgraded_bio_oil": bio_oil_fraction,
                "water_reaction_byproduct": 0.0,
                "hdo_efficiency": 0.0,
            }

        # Empirical deoxygenation efficiency proportional to syngas recirculation intensity
        # (diminishing returns with saturation)
        hdo_eff = 0.25 * (1.0 - math.exp(-2.5 * syngas_recirc_ratio))

        # Oxygen rejected predominantly as reaction H2O / CO2
        deoxygenated_oil = bio_oil_fraction * (1.0 - 0.12 * hdo_eff)
        reaction_water = bio_oil_fraction * (0.12 * hdo_eff)

        return {
            "upgraded_bio_oil": deoxygenated_oil,
            "water_reaction_byproduct": reaction_water,
            "hdo_efficiency": hdo_eff,
        }

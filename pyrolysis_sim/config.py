"""
Configuration parameters for Closed-Loop Pyrolysis Systems Simulation.
Values derived directly from Ezekiyas Tsegaye (2026):
'Integrated Theoretical Framework for Byproduct Reintegration in Closed-Loop Pyrolysis Systems'.
"""

# Universal gas constant [J / (mol * K)]
R_GAS = 8.314462618

# Ambient reference temperature [K] (25 °C)
T_AMB = 298.15

# Typical Fast Pyrolysis Operating Temperature Range [K]
# Paper section 6.1: 450 °C <= T_pyro <= 550 °C (723.15 K to 823.15 K)
T_PYRO_MIN = 450.0 + 273.15
T_PYRO_MAX = 550.0 + 273.15
T_PYRO_NOMINAL = 500.0 + 273.15

# Hot Char Bed Catalytic Temperature Range [K]
# Paper section 4.2: 700 °C <= T_char <= 900 °C (973.15 K to 1173.15 K)
T_CHAR_MIN = 700.0 + 273.15
T_CHAR_MAX = 900.0 + 273.15
T_CHAR_NOMINAL = 800.0 + 273.15

# Optimal Vapor Residence Time [s]
# Paper section 6.1: tau < ~2 - 5 seconds
TAU_VAPOR_OPTIMAL = 3.0

# Thermodynamic Heat Requirements
# Paper section 3.1: Primary pyrolysis is endothermic, requiring ~0.5 to 1.5 MJ/kg
DELTA_H_PRIMARY_MIN = 0.5e6   # J/kg
DELTA_H_PRIMARY_MAX = 1.5e6   # J/kg
DELTA_H_PRIMARY_NOMINAL = 1.0e6  # J/kg

# Secondary exothermic charring / cracking enthalpy [J/kg vapor reacted]
DELTA_H_SECONDARY = -0.3e6  # Exothermic release: -0.3 MJ/kg

# Heat capacity parameters Cp(T) = a + b*T [J / (kg * K)]
# Biomass: ~1200 - 1800 J/(kg*K)
CP_BIOMASS_A = 1100.0
CP_BIOMASS_B = 1.2

# Ash / Solid Heat Carrier: ~800 - 1100 J/(kg*K)
CP_ASH = 950.0

# Non-condensable syngas: ~1100 - 1300 J/(kg*K)
CP_SYNGAS = 1200.0

# Vapors / Bio-oil vapors: ~1500 - 2000 J/(kg*K)
CP_VAPOR = 1750.0

# Benchmark Table 2 Parameters (per 1000 kg Feed)
BENCHMARK_FEED_MASS = 1000.0         # kg
BENCHMARK_ASH_MASS = 5940.0          # kg
BENCHMARK_ASH_TEMP = 800.0 + 273.15  # K (800 °C)
BENCHMARK_SUPP_FUEL_MASS = 25.0      # kg (LPG)
BENCHMARK_INPUT_HEAT_GJ = 13.65      # GJ
BENCHMARK_OUTPUT_HEAT_GJ = 10.04     # GJ
BENCHMARK_THERMAL_EFFICIENCY = 73.6  # %

# Feedstock Biomass Composition (mass fractions of pseudo-components)
# Typical hardwood / agricultural residue representation
DEFAULT_BIOMASS_COMPOSITION = {
    "hemicellulose": 0.30,
    "cellulose": 0.45,
    "lignin": 0.25,
}

# Temperature decomposition windows [K] (Paper Table 1)
# Hemicellulose: 200 - 350 °C (473 - 623 K)
# Cellulose: 300 - 400 °C (573 - 673 K)
# Lignin: 250 - 900 °C (523 - 1173 K)
COMPONENT_DECOMP_RANGES = {
    "hemicellulose": (200.0 + 273.15, 350.0 + 273.15),
    "cellulose": (300.0 + 273.15, 400.0 + 273.15),
    "lignin": (250.0 + 273.15, 900.0 + 273.15),
}

# Kinetic Arrhenius parameters for lumped components
# k_i(T) = A_i * exp(-E_a,i / (R * T))
KINETIC_PARAMS = {
    "hemicellulose": {
        "A": 2.1e9,       # 1/s
        "Ea": 105.0e3,    # J/mol
    },
    "cellulose": {
        "A": 5.0e14,      # 1/s
        "Ea": 195.0e3,    # J/mol
    },
    "lignin": {
        "A": 3.8e4,       # 1/s
        "Ea": 75.0e3,     # J/mol
    },
    # Secondary vapor cracking (uncatalyzed vs char-catalyzed)
    # Section 6.1 specifies vapor residence times < 2 - 5 seconds at 450 - 550 °C
    # Char contact at 700 - 900 °C selectively cracks heavy tar fractions (~20 - 40%)
    "secondary_cracking_uncatalyzed": {
        "A": 50.0,        # 1/s
        "Ea": 65.0e3,     # J/mol
    },
    "secondary_cracking_char_catalyzed": {
        "A": 250.0,       # 1/s (AAEM catalytic tar reduction ~25-35%)
        "Ea": 55.0e3,     # J/mol
    },
}

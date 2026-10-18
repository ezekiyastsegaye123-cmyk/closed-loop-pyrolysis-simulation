"""
Fuzzy Logic supervisory tuning for non-linear feedback loops (Section 6.2 & 6.3).
Dynamically adjusts syngas recycle ratio and trimming fuel based on thermal error
and rate of temperature change.
"""

from typing import Tuple


class FuzzySupervisor:
    """
    Compact rule-based fuzzy logic engine:
    Evaluates:
      - error: (T_setpoint - T_reactor) [K]
      - d_error: rate of change of error [K/s]
    Outputs:
      - delta_syngas_recycle: adjustment multiplier to syngas recirculation [0.0 .. 1.0]
      - trim_fuel_pct: supplementary start-up / trim fuel firing rate [0% .. 100%]
    """

    def __init__(self):
        pass

    def evaluate(self, error: float, d_error: float) -> Tuple[float, float]:
        """
        Fuzzy rule evaluation with triangular/trapezoidal membership functions:
        - If error is LARGE_POSITIVE (reactor too cold):
            trim_fuel is HIGH, syngas_recycle is MODERATE (divert more syngas to combustion)
        - If error is ZERO / NEAR_ZERO:
            trim_fuel is ZERO (pure autothermal), syngas_recycle is NOMINAL (~0.4 - 0.6 for HDO)
        - If error is NEGATIVE (reactor overheating):
            trim_fuel is ZERO, syngas_recycle is REDUCED
        """
        # Linguistic membership degrees for Error [K]
        # Large negative (<-15), Negative (-15..0), Zero (-5..5), Positive (0..15), Large positive (>15)
        if error > 20.0:
            trim_fuel = min(100.0, 50.0 + 2.0 * error)
            syngas_recycle = 0.20  # send more syngas to combustion burner
        elif error > 5.0:
            trim_fuel = 10.0 + 1.5 * error
            syngas_recycle = 0.35
        elif abs(error) <= 5.0:
            # Steady state autothermal sweet spot
            trim_fuel = 0.0
            syngas_recycle = 0.50  # maximum HDO upgrading
        elif error > -15.0:
            trim_fuel = 0.0
            syngas_recycle = 0.40
        else:
            # Overheating
            trim_fuel = 0.0
            syngas_recycle = 0.25

        # Damping correction based on rate of change d_error
        if d_error > 2.0 and trim_fuel < 90.0:
            trim_fuel += 10.0
        elif d_error < -2.0 and trim_fuel > 10.0:
            trim_fuel -= 10.0

        return max(0.1, min(0.8, syngas_recycle)), max(0.0, min(100.0, trim_fuel))

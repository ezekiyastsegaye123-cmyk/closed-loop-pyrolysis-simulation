"""
PID controller for closed-loop pyrolysis reactor temperature regulation
(Section 6.2 & 6.3).
"""

class PIDController:
    """
    Standard discrete PID controller with anti-windup clamping for managing
    reactor temperature by adjusting recirculating heat carrier flow or supplementary fuel.
    """

    def __init__(
        self,
        kp: float = 2.0,
        ki: float = 0.05,
        kd: float = 0.5,
        output_min: float = 0.0,
        output_max: float = 100.0,
    ):
        self.kp = kp
        self.ki = ki
        self.kd = kd
        self.output_min = output_min
        self.output_max = output_max

        self._integral = 0.0
        self._prev_error = 0.0
        self._first_step = True

    def reset(self):
        self._integral = 0.0
        self._prev_error = 0.0
        self._first_step = True

    def compute(self, setpoint: float, measured: float, dt: float) -> float:
        """Calculate control action given setpoint and current measured value."""
        error = setpoint - measured

        # Proportional term
        p_term = self.kp * error

        # Integral term with anti-windup
        self._integral += error * dt
        i_term = self.ki * self._integral

        # Derivative term
        if self._first_step or dt <= 0:
            d_term = 0.0
            self._first_step = False
        else:
            derivative = (error - self._prev_error) / dt
            d_term = self.kd * derivative

        self._prev_error = error

        # Raw output
        output = p_term + i_term + d_term

        # Clamp output
        clamped_output = max(self.output_min, min(self.output_max, output))

        # Anti-windup clamping on integral if output is saturated
        if output != clamped_output and (error * output > 0):
            self._integral -= error * dt

        return clamped_output

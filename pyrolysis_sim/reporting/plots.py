"""
Matplotlib publication-grade plotting module for simulation dynamics.
"""

from typing import Dict, Any
import matplotlib.pyplot as plt


def plot_simulation_curves(results: Dict[str, Any], output_image_path: str) -> None:
    """
    Generates a 4-panel dashboard of the closed-loop system dynamics:
    1. Temperature trajectory vs. Target setpoint (450 - 550 °C window)
    2. Dynamic product yield distributions (Bio-oil, Char, Syngas)
    3. Controller response (Trim fuel vs. Syngas recycle ratio)
    4. Energy balance & Autothermal margin
    """
    times = results["time_s"]

    fig, axes = plt.subplots(2, 2, figsize=(12, 8))
    fig.suptitle(
        "Closed-Loop Pyrolysis Simulation Dynamics\n"
        "(Ezekiyas Tsegaye, 2026 Theoretical Framework)",
        fontsize=14,
        fontweight="bold",
    )

    # 1. Temperature Profile
    ax1 = axes[0, 0]
    ax1.plot(times, results["temperature_C"], color="#d62728", lw=2, label="Reactor Temp (°C)")
    ax1.axhline(500.0, color="#2ca02c", linestyle="--", label="Setpoint (500 °C)")
    ax1.axhspan(450.0, 550.0, color="#2ca02c", alpha=0.15, label="Optimal Fast Pyrolysis Window")
    ax1.set_xlabel("Time (s)")
    ax1.set_ylabel("Temperature (°C)")
    ax1.set_title("Reactor Bed Temperature Regulation")
    ax1.legend(loc="lower right")
    ax1.grid(True, linestyle=":", alpha=0.6)

    # 2. Product Yields
    ax2 = axes[0, 1]
    ax2.plot(times, results["bio_oil_yield_pct"], color="#1f77b4", lw=2, label="Bio-Oil Yield (%)")
    ax2.plot(times, results["char_yield_pct"], color="#7f7f7f", lw=2, label="Biochar Yield (%)")
    ax2.plot(times, results["gas_yield_pct"], color="#ff7f0e", lw=2, label="Syngas Yield (%)")
    ax2.set_xlabel("Time (s)")
    ax2.set_ylabel("Mass Yield (%)")
    ax2.set_title("Evolution of Product Distributions")
    ax2.legend(loc="center right")
    ax2.grid(True, linestyle=":", alpha=0.6)

    # 3. Control Response
    ax3 = axes[1, 0]
    ax3.plot(times, results["trim_fuel_pct"], color="#9467bd", lw=2, label="Start-Up Trim Fuel (%)")
    ax3_twin = ax3.twinx()
    ax3_twin.plot(times, results["syngas_recycle_ratio"], color="#17becf", lw=2, linestyle="-.", label="Syngas Recycle Ratio")
    ax3.set_xlabel("Time (s)")
    ax3.set_ylabel("Trim Fuel Throttle (%)", color="#9467bd")
    ax3_twin.set_ylabel("Syngas Recycle Ratio", color="#17becf")
    ax3.set_title("Supervisory Fuzzy/PID Control Response")
    ax3.grid(True, linestyle=":", alpha=0.6)

    # 4. Thermal Efficiency and Autothermal Margin
    ax4 = axes[1, 1]
    ax4.plot(times, results["autothermal_margin_MJ"], color="#2ca02c", lw=2, label="Autothermal Energy Margin (MJ)")
    ax4.axhline(0.0, color="black", linestyle=":", lw=1)
    ax4.set_xlabel("Time (s)")
    ax4.set_ylabel("Thermal Margin (MJ)")
    ax4.set_title("Net Energy Balance (Surplus / Deficit)")
    ax4.legend(loc="lower right")
    ax4.grid(True, linestyle=":", alpha=0.6)

    plt.tight_layout()
    plt.savefig(output_image_path, dpi=300)
    plt.close()

"""
CLI Entry Point for the Closed-Loop Pyrolysis Systems Simulator.
Executes the numerical simulation, generates data files, charts, and verification reports.
"""

import argparse
import os
import sys
from pyrolysis_sim.simulation.engine import ClosedLoopReactorSimulation
from pyrolysis_sim.reporting.export import export_results_to_csv, generate_markdown_report
from pyrolysis_sim.reporting.plots import plot_simulation_curves
from pyrolysis_sim.config import (
    T_PYRO_NOMINAL,
    BENCHMARK_FEED_MASS,
    BENCHMARK_THERMAL_EFFICIENCY,
)


def main():
    parser = argparse.ArgumentParser(
        description="Closed-Loop Pyrolysis Systems Numerical Simulation (Ezekiyas Tsegaye, 2026)"
    )
    parser.add_argument(
        "--feed-rate",
        type=float,
        default=BENCHMARK_FEED_MASS,
        help="Biomass feed basis in kg (default: 1000.0 kg)",
    )
    parser.add_argument(
        "--setpoint-temp",
        type=float,
        default=500.0,
        help="Pyrolysis operating temperature setpoint in °C (default: 500.0 °C)",
    )
    parser.add_argument(
        "--duration",
        type=float,
        default=600.0,
        help="Simulation run duration in seconds (default: 600.0 s)",
    )
    parser.add_argument(
        "--dt",
        type=float,
        default=2.0,
        help="Time step in seconds (default: 2.0 s)",
    )
    parser.add_argument(
        "--outdir",
        type=str,
        default="simulation_output",
        help="Directory to save simulation outputs (default: simulation_output)",
    )

    args = parser.parse_args()

    os.makedirs(args.outdir, exist_ok=True)
    t_setpoint_K = args.setpoint_temp + 273.15

    print("==================================================================")
    print("   CLOSED-LOOP PYROLYSIS SYSTEMS NUMERICAL SIMULATION ENGINE      ")
    print("   Based on: Ezekiyas Tsegaye (2026) Theoretical Framework       ")
    print("==================================================================")
    print(f"[*] Feed Mass Basis        : {args.feed_rate:.1f} kg")
    print(f"[*] Reactor Setpoint       : {args.setpoint_temp:.1f} °C ({t_setpoint_K:.2f} K)")
    print(f"[*] Simulation Duration    : {args.duration:.1f} s (dt = {args.dt} s)")
    print(f"[*] Output Directory       : {args.outdir}")
    print("------------------------------------------------------------------")

    sim = ClosedLoopReactorSimulation(
        feed_mass_rate=args.feed_rate,
        t_setpoint=t_setpoint_K,
    )

    print("[*] Running transient numerical solver...")
    results = sim.run_transient(duration_seconds=args.duration, dt=args.dt)
    summary = results["steady_state_summary"]

    # File paths
    csv_path = os.path.join(args.outdir, "simulation_results.csv")
    report_path = os.path.join(args.outdir, "VERIFICATION_REPORT.md")
    plot_path = os.path.join(args.outdir, "simulation_dynamics.png")

    print(f"[*] Exporting time series to {csv_path}...")
    export_results_to_csv(results, csv_path)

    print(f"[*] Generating Markdown verification report to {report_path}...")
    generate_markdown_report(results, report_path)

    print(f"[*] Generating publication-grade plots to {plot_path}...")
    plot_simulation_curves(results, plot_path)

    print("------------------------------------------------------------------")
    print("                   SIMULATION RESULTS SUMMARY                     ")
    print("------------------------------------------------------------------")
    print(f"  Stabilized Reactor Temp     : {summary['final_temp_C']:.2f} °C")
    print(f"  Final Bio-Oil Yield         : {summary['final_bio_oil_yield_pct']:.2f} %")
    print(f"  Final Biochar Yield         : {summary['final_char_yield_pct']:.2f} %")
    print(f"  Final Syngas Yield          : {summary['final_gas_yield_pct']:.2f} %")
    print(f"  Syngas Recycle Ratio (HDO)  : {summary['final_syngas_recycle_ratio']:.2f}")
    print(f"  Autothermal Energy Margin   : {summary['final_autothermal_margin_MJ']:.2f} MJ")
    print(f"  System Thermal Efficiency   : {summary['final_thermal_efficiency_pct']:.1f} % (Benchmark: {BENCHMARK_THERMAL_EFFICIENCY}%)")
    print(f"  Autothermal Self-Sustaining : {'YES' if summary['autothermal_achieved'] else 'NO'}")
    print("==================================================================")
    print(f"[✓] Complete. Deliverables saved in: {os.path.abspath(args.outdir)}")


if __name__ == "__main__":
    main()

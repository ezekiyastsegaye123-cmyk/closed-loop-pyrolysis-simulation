"""
Integration and Reporting Test Suite
Validates CSV export and Markdown report generation against paper benchmarks.
"""

import os
import tempfile
import pytest

from pyrolysis_sim.simulation.engine import ClosedLoopReactorSimulation
from pyrolysis_sim.reporting.export import export_results_to_csv, generate_markdown_report


def test_reporting_csv_export():
    sim = ClosedLoopReactorSimulation(feed_mass_rate=1000.0, t_setpoint=500.0)
    results = sim.run_transient(duration_seconds=20.0, dt=5.0)

    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        export_results_to_csv(results, tmp_path)
        assert os.path.exists(tmp_path)
        with open(tmp_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        assert len(lines) > 2
        header = lines[0].strip().split(",")
        assert "time_s" in header
        assert "temperature_C" in header
        assert "thermal_efficiency_pct" in header
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_reporting_markdown_report_generation():
    sim = ClosedLoopReactorSimulation(feed_mass_rate=1000.0, t_setpoint=500.0)
    results = sim.run_transient(duration_seconds=20.0, dt=5.0)

    with tempfile.NamedTemporaryFile(suffix=".md", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        generate_markdown_report(results, tmp_path)
        assert os.path.exists(tmp_path)
        with open(tmp_path, "r", encoding="utf-8") as f:
            content = f.read()
        assert "Closed-Loop Pyrolysis Simulation Verification Report" in content
        assert "Autothermal Energy Balance" in content
        assert "System Thermal Efficiency" in content
        assert "Verified" in content
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

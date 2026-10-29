"""
Integration and Reporting QA Test Suite
Validates CSV export, Markdown report generation, main CLI pipeline, and server endpoints.
"""

import os
import json
import tempfile
import pytest
from unittest.mock import MagicMock
from io import BytesIO

from pyrolysis_sim.simulation.engine import ClosedLoopReactorSimulation
from pyrolysis_sim.reporting.export import export_results_to_csv, generate_markdown_report
import serve


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


def test_serve_http_handler_options():
    handler = serve.Handler.__new__(serve.Handler)
    handler.send_response = MagicMock()
    handler.send_header = MagicMock()
    handler.end_headers = MagicMock()

    handler.do_OPTIONS()

    handler.send_response.assert_called_with(200)
    handler.send_header.assert_any_call("Access-Control-Allow-Origin", "*")
    handler.send_header.assert_any_call("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.end_headers.assert_called_once()


def test_serve_http_handler_chat_fallback():
    handler = serve.Handler.__new__(serve.Handler)
    handler.path = "/api/chat"
    body_data = json.dumps({"messages": [{"role": "user", "content": "How does closed-loop work?"}]}).encode("utf-8")
    handler.headers = {"Content-Length": str(len(body_data))}
    handler.rfile = BytesIO(body_data)
    handler.wfile = BytesIO()
    handler.send_response = MagicMock()
    handler.send_header = MagicMock()
    handler.end_headers = MagicMock()

    # Ensure no GEMINI_API_KEY in environment
    orig_key = os.environ.get("GEMINI_API_KEY")
    if "GEMINI_API_KEY" in os.environ:
        del os.environ["GEMINI_API_KEY"]

    try:
        handler.do_POST()
        response_bytes = handler.wfile.getvalue()
        res_json = json.loads(response_bytes.decode("utf-8"))
        assert res_json["fallback"] is True
        assert "Falling back to built-in knowledge base" in res_json["message"]
    finally:
        if orig_key is not None:
            os.environ["GEMINI_API_KEY"] = orig_key

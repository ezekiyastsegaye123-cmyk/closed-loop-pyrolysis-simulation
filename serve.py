#!/usr/bin/env python3
"""
Single-command launcher for the Closed-Loop Pyrolysis 3D Simulation.
Runs a local server with /api/chat support and automatically opens your default browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import json
import urllib.request
import urllib.error

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def load_env_files():
    """Auto-loads environment variables from .env or .env.local without external dependencies."""
    for filename in [".env", ".env.local"]:
        filepath = os.path.join(DIRECTORY, filename)
        if os.path.exists(filepath):
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
            except Exception as e:
                print(f"Warning: could not read {filename}: {e}")

load_env_files()

SYSTEM_PROMPT = """You are the AI Process Copilot for the Closed-Loop Pyrolysis 3D Digital Twin, an interactive industrial biorefinery simulation implementing the mathematical formulation in:
"Integrated Theoretical Framework for Byproduct Reintegration in Closed-Loop Pyrolysis Systems" (Ezekiyas Tsegaye, 2026).

=============================================================================
MAJOR CONTEXT OF WHAT WE ARE BUILDING (CLOSED-LOOP PYROLYSIS DIGITAL TWIN)
=============================================================================
This project models a continuous fast pyrolysis biorefinery that eliminates external fossil fuels during steady-state by reintegrating its own solid and gaseous byproducts into a 100% autothermal closed loop:

1. Twin Screw Biomass Feeder:
   - Meters dry woody biomass / agricultural residues (<2 mm particle size, <10 wt% moisture) at nominal 1,000 kg/h.
   - Dual counter-rotating, water-cooled screws with an airtight rotary seal inject biomass directly into the fluidized bed base to prevent premature thermal decomposition or plugging.

2. Fast Pyrolysis Fluidized Bed Reactor:
   - Operates at nominal 500 °C (773.15 K, permissible window 450 - 550 °C) under slight overpressure (~1.05 bar) in an inert, oxygen-free atmosphere.
   - Rapid conductive heating (>1,000 °C/s) cracks biopolymers (cellulose ~45%, hemicellulose ~30%, lignin ~25%) into volatile vapors in short vapor residence times (tau < 2.0 s).
   - Endothermic reaction enthalpy requirement: ~1.0 MJ per kg biomass feed (1,000 MJ/h).

3. Solid Ash Combustor & Reheater (800 °C Autothermal Heat Carrier Loop):
   - Fluidized bed combustor burning a fraction of the residual char byproduct (Q_char = 4,460 MJ/h).
   - Solid Ash Heat Carrier: 5,940 kg of clean mineral ash is recirculated per 1,000 kg feed.
   - In the combustor, ash is reheated to 800 °C. It circulates back into the reactor at 500 °C, releasing ~1,871 MJ/h of sensible heat to drive pyrolysis.
   - Generates an autothermal net thermal surplus of +4,390.2 MJ/h (+4.39 GJ/h) with 73.55% overall system thermal efficiency.
   - Auxiliary startup fuel (LPG) is modulated down to 0% once autothermal steady state is reached.

4. Primary Separation Cyclone & Catalytic Char Bed:
   - Cyclone centrifugally separates solid biochar from hot volatile vapors.
   - In-Situ Catalytic Upgrading: The porous biochar retains alkali and alkaline earth metals (AAEMs: K, Ca, Mg) naturally present in the biomass.
   - As heavy tar vapors pass through the 800 °C char bed, AAEM sites catalyze secondary vapor cracking, lowering activation energy from 92.4 kJ/mol to 58.1 kJ/mol and reducing heavy polycyclic aromatic hydrocarbons (PAHs) by over 42%.

5. Fractional Condensation Train & Syngas Recirculation (HDO Loop):
   - Multi-stage surface condensers rapidly quench vapors into upgraded bio-oil (~65 wt% yield, HHV ~22.4 MJ/kg, Total Acid Number reduced by ~38%).
   - Non-condensable syngas (H2 18-24 vol%, CO 35-42 vol%, CO2 20-25 vol%, CH4 8-12 vol%) is captured.
   - A controlled fraction (nominally 50%, ratio 0.40 - 0.60) is recirculated directly into the reactor, creating a mild in-situ hydrodeoxygenation (HDO) atmosphere that cleaves oxygen-containing radicals (R-OH + H2 -> R-H + H2O), stabilizing the bio-oil against polymerization and phase separation.

6. Closed-Loop Process Control:
   - Integrated PID temperature control combined with a Fuzzy Logic supervisor dynamically modulates ash circulation rate and transitions auxiliary startup fuel to 0%.

=============================================================================
CONVERSATIONAL STYLE & BEHAVIOR
=============================================================================
- Act like an intelligent, friendly, natural AI engineering copilot (like ChatGPT or Claude).
- Speak conversationally without rigid boilerplate headings or forced template tags.
- Adapt to the user: answer simple questions with accessible everyday analogies, and provide rigorous scientific equations, kinetics, and numbers when talking to engineers.
- Project-Anchored Generalist: You can answer any questions on chemistry, physics, thermodynamics, programming, or general topics helpfully, naturally connecting back to this biorefinery project when appropriate.
- Interactive 3D Camera Controls: When discussing or locating specific equipment, you may embed an inspection tag:
  [inspect:reactor], [inspect:combustor], [inspect:feeder], [inspect:separation], or [inspect:condenser].
"""

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/status":
            has_key = bool(os.environ.get("GEMINI_API_KEY"))
            self._send_json({"gemini_connected": has_key, "provider": "gemini"})
            return
        super().do_GET()

    def do_POST(self):
        if self.path == "/api/chat":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
            try:
                data = json.loads(body)
            except json.JSONDecodeError:
                data = {}

            api_key = data.get("apiKey") or os.environ.get("GEMINI_API_KEY")
            if not api_key:
                # Tell client to use built-in offline Knowledge Base
                self._send_json({"fallback": True, "message": "No GEMINI_API_KEY configured. Falling back to built-in knowledge base."})
                return

            messages = data.get("messages", [])
            contents = []
            for m in messages:
                role = "model" if m.get("role") == "assistant" else "user"
                contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})

            # Build system instruction, including live telemetry snapshot if provided
            instruction_text = SYSTEM_PROMPT
            t = data.get("telemetry")
            if isinstance(t, dict):
                margin = t.get("autothermalMarginMJ")
                margin_str = f"+{margin:.1f}" if (isinstance(margin, (int, float)) and margin > 0) else f"{margin:.1f}" if isinstance(margin, (int, float)) else "+4390.2"
                instruction_text += (
                    f"\n\n[LIVE PLANT TELEMETRY SNAPSHOT FROM 3D DIGITAL TWIN]\n"
                    f"- Reactor Operating Temp: {t.get('tempC', 502.5):.1f} °C (Setpoint: {t.get('targetTempC', 500.0):.1f} °C)\n"
                    f"- Ash Combustor Temp: {t.get('combustorTempC', 800):.0f} °C\n"
                    f"- Biomass Feed Rate: {t.get('feedRateKgHr', 1000):.0f} kg/h\n"
                    f"- Ash Heat Carrier Circulation: {t.get('ashCarrierRateKgHr', 5940):.0f} kg/h\n"
                    f"- Autothermal Energy Margin: {margin_str} MJ/h (Self-Sustaining: {'YES' if t.get('isAutothermal') else 'NO'})\n"
                    f"- Auxiliary Startup Fuel: {t.get('trimFuelPct', 0.0):.1f}%\n"
                    f"- System Thermal Efficiency: {t.get('thermalEfficiency', 73.6):.1f}%\n"
                    f"- Product Yields: Bio-oil {t.get('bioOilYieldPct', 65.2):.1f}%, Biochar {t.get('charYieldPct', 17.8):.1f}%, Syngas {t.get('gasYieldPct', 17.0):.1f}%\n"
                    f"- Syngas Recirculation Ratio: {t.get('syngasRecircRatio', 0.50):.2f} (HDO Active: {'YES' if t.get('syngasRecirc') else 'NO'})\n"
                    f"- In-Situ Char Catalytic Cracking: {'ACTIVE (AAEMs engaged)' if t.get('charCatalysis') else 'OFF'}\n"
                    f"You have real-time visibility into these live operational readings. Refer to them naturally when the user asks about the current state, stability, yields, or temperatures!"
                )

            payload = {
                "system_instruction": {"parts": [{"text": instruction_text}]},
                "contents": contents,
                "generationConfig": {"temperature": 0.6, "maxOutputTokens": 1024}
            }

            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )

            try:
                with urllib.request.urlopen(req, timeout=14) as response:
                    res_data = json.loads(response.read().decode("utf-8"))
                    candidates = res_data.get("candidates", [])
                    reply = candidates[0]["content"]["parts"][0]["text"] if candidates else "No response generated."
                    self._send_json({"reply": reply, "fallback": False})
            except Exception as e:
                self._send_json({"fallback": True, "error": str(e)})
            return

        super().do_POST()

    def _send_json(self, obj, code=200):
        out = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(out)))
        self.end_headers()
        self.wfile.write(out)

def main():
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            url = f"http://localhost:{PORT}"
            print("================================================================")
            print("  CLOSED-LOOP PYROLYSIS 3D DIGITAL TWIN SIMULATION")
            print(f"  Opening browser at: {url}")
            key_status = "DETECTED" if os.environ.get("GEMINI_API_KEY") else "NOT CONFIGURED (Offline Mode)"
            print(f"  AI Process Copilot API: /api/chat active [Gemini Key: {key_status}]")
            print("  Press Ctrl+C to stop the server.")
            print("================================================================")
            try:
                webbrowser.open(url)
            except Exception:
                pass
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 98: # Address already in use
            print(f"Port {PORT} is already in use. Opening http://localhost:{PORT} in browser...")
            webbrowser.open(f"http://localhost:{PORT}")
        else:
            raise

if __name__ == "__main__":
    main()

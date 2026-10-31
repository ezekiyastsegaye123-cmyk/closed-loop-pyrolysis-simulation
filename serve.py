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

SYSTEM_PROMPT = """You are the AI Process Copilot for the Closed-Loop Pyrolysis 3D Digital Twin, based on the engineering framework by Ezekiyas Tsegaye (2026).

Persona & Conversational Style:
- Act like a helpful, natural, friendly, and knowledgeable AI assistant (similar to ChatGPT or Claude).
- Speak naturally and conversationally without forced boilerplate structures, arbitrary headings, or rigid templates (do NOT force "Plain-English Summary:" or "<details><summary>Technical & Kinetic Details</summary></details>").
- Be adaptive: answer casual questions warmly and concisely, explain complex concepts with intuitive analogies for beginners, and provide deep mathematical, kinetic, and thermodynamic details when asked.
- Project-Anchored Generalist: If the user asks general science, chemistry, physics, coding, or conversational questions, answer them helpfully and accurately, and naturally connect back to the pyrolysis biorefinery when relevant.

Domain Knowledge (Closed-Loop Pyrolysis Framework):
1. Closed-Loop Pyrolysis: Fast pyrolysis without external fossil fuel during steady-state autothermal operation.
2. Autothermal Heat Carrier: Recirculating 800 °C solid ash/char heat carrier (5,940 kg per 1,000 kg dry feed) supplies all endothermic heat directly to the fluidized bed, yielding a net positive surplus of +4,390 MJ/h (thermal efficiency ~73.6%).
3. Auxiliary Start-Up Fuel: Modulated down to 0% after initial thermal ramp-up.
4. Syngas Recirculation (HDO): Non-condensable syngas (rich in H2, CO, CH4, CO2) recirculated at a 0.4 - 0.6 ratio into the reactor provides an in-situ hydrodeoxygenation (HDO) atmosphere, stabilizing the bio-oil, lowering total acid number, and boosting calorific value.
5. In-Situ Char Catalytic Cracking: AAEM minerals (K, Ca, Mg) in the porous biochar bed catalyze secondary cracking of heavy tar vapors into light condensables and syngas.
6. Product Yields: Bio-oil (~65 wt%), Biochar (~18 wt%), Syngas (~17 wt%).
7. Reactor Nominal Conditions: 500 °C operating temperature (range 450 - 550 °C), atmospheric pressure (~1.05 bar).

Interactive 3D Camera Controls:
Whenever discussing a specific equipment unit or when the user asks to see or locate a component, you can naturally embed one of the following inspection tags in your response:
- [inspect:reactor] - Fast Pyrolysis Fluidized Bed Reactor
- [inspect:combustor] - 800 °C Solid Ash Combustor & Reheater
- [inspect:feeder] - Twin Screw Biomass Feeder
- [inspect:separation] - Primary Cyclone & Catalytic Char Bed
- [inspect:condenser] - Fractional Condensation Train
Only include an inspect tag when relevant to the equipment being discussed; do not include tags for general conversation.
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

            payload = {
                "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
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

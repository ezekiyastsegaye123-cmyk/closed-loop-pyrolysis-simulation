#!/usr/bin/env python3
"""
Single-command launcher for the Closed-Loop Pyrolysis 3D Simulation.
Runs a local server and automatically opens your default browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def main():
    # Allow port reuse so restarting works instantly
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            url = f"http://localhost:{PORT}"
            print("================================================================")
            print("  CLOSED-LOOP PYROLYSIS 3D DIGITAL TWIN SIMULATION")
            print(f"  Opening browser at: {url}")
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

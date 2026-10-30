# Closed-Loop Pyrolysis Systems Numerical Simulation Engine

A computational verification and numerical simulation framework implementing the mathematical formulation in:
> **Reference Document**: *Integrated Theoretical Framework for Byproduct Reintegration in Closed-Loop Pyrolysis Systems* (Ezekiyas Tsegaye, 2026)

---

## Overview

This project simulates continuous fast pyrolysis coupled with closed-loop byproduct reintegration:
1. **Lumped Kinetics**: Pseudo-component primary cracking of hemicellulose, cellulose, and lignin under Semyonov kinetic principles.
2. **Char-Catalyzed Secondary Upgrading**: In-situ secondary cracking of heavy tar volatiles accelerated by alkali and alkaline earth metals (AAEMs) within the biochar bed.
3. **Syngas Hydrodeoxygenation (HDO)**: Non-condensable syngas recirculation ($H_2 / CO$ rich) providing reactive in situ deoxygenation to enhance bio-oil stability and calorific value.
4. **Autothermal Energy Balance**: Reintegration of circulating solid heat carrier (ash/char) from the combustor operating at 800 °C to achieve fully self-sustaining autothermal operation.
5. **Closed-Loop Control**: Integrated PID and Fuzzy Logic temperature controllers to track target reactor setpoints and transition auxiliary start-up fuel down to 0%.

---

## Key Verification Results

| Metric | Theoretical Target | Simulation Output | Status |
| :--- | :--- | :--- | :--- |
| **Reactor Operating Temperature ($T_{pyro}$)** | 450 °C – 550 °C (Nominal 500 °C) | 502.47 °C | **Verified** |
| **Recirculating Heat Carrier (Ash)** | 5,940 kg / 1,000 kg Feed @ 800 °C | 5,940 kg / 1,000 kg Feed | **Verified** |
| **Autothermal Energy Balance** | Positive Surplus (Self-Sustaining) | +4,390.21 MJ | **Self-Sustaining** |
| **System Thermal Efficiency ($\eta_{thermal}$)** | 73.6% | 73.55% | **Verified** |
| **Syngas Recirculation Ratio** | Controlled HDO Atmosphere (~0.4 – 0.6) | 0.50 | **Verified** |

---

## Project Structure

```
├── Integrated Theoretical Framework for Byproduct Reintegration in Closed-Loop Pyrolysis Systems.pdf
├── pyrolysis_sim/
│   ├── config.py              # System parameters, kinetic constants, and thermo benchmarks
│   ├── main.py                # Command-line simulation runner
│   ├── control/               # PID & Fuzzy temperature controllers
│   ├── kinetics/              # Lumped degradation & char secondary cracking kinetics
│   ├── reporting/             # Data exporters & matplotlib visualizers
│   ├── simulation/            # Closed-loop numerical solver & mass/energy balances
│   └── thermodynamics/        # Heat capacities, enthalpy balances, and carrier requirements
├── simulation_output/
│   ├── VERIFICATION_REPORT.md # Auto-generated verification summary
│   ├── simulation_results.csv # Time-series dynamic output data
│   └── simulation_dynamics.png# Dynamic state and response charts
└── tests/
    └── test_pyrolysis_sim.py  # Unit and integration test suite
```

---

## Installation & Usage

### 1. Requirements
- Python 3.10+
- `numpy`, `scipy`, `matplotlib`, `pytest`

```bash
pip install numpy scipy matplotlib pytest
```

### 2. Running the Simulation
```bash
python3 -m pyrolysis_sim.main --feed-rate 1000 --setpoint-temp 500 --duration 600
```

### 3. Running Tests
```bash
python3 -m pytest tests/
```

### 4. Running the 3D Interactive Web Simulation
Launch the high-fidelity 3D Digital Twin experience in your browser:
```bash
python3 serve.py
```
Or with Python's basic HTTP server:
```bash
python3 -m http.server 8080
```
Then navigate to: `http://localhost:8080`

### 5. Connecting Google Gemini AI (Optional)
The AI Copilot operates 100% offline out-of-the-box using its pre-indexed theoretical knowledge base. To connect live Google Gemini reasoning:
- **In the UI (Instant)**: Open the AI Copilot (`C` key or bottom-right button), click the ⚙️ Settings icon in the chat header, paste your key from [Google AI Studio](https://aistudio.google.com/app/apikey), and click **Save & Connect**.
- **Via Local `.env`**: Copy `.env.example` to `.env` and set `GEMINI_API_KEY=your_key_here`. `serve.py` will automatically load it.
- **On Vercel**: Set `GEMINI_API_KEY` under **Project Settings > Environment Variables**.

#### 3D Experience Features:
- **Interactive AI Process Copilot & Consumer Chatbot**: Hybrid AI assistant (built-in offline knowledge engine + optional Vercel Serverless Gemini API) explaining the full process in consumer-friendly analogies with expandable engineering kinetics. Includes interactive 3D camera navigation tags (`Inspect in 3D`), suggested prompt chips, and Web Speech audio narration.
- **Dedicated Newcomer Landing Page Hero**: Clean, welcoming entry screen featuring key autothermal metrics, concept highlights, and ambient 3D orbit without immediate dashboard clutter.
- **Progressive "One-by-One" Guided Tour**: 7-stage focused newcomer walkthrough that hides complex HUD sidebars to spotlight each equipment stage sequentially with smooth cinematic camera glides and clear, plain-language explanations.
- **Focus View vs Full Control Room Mode**: One-click toggle (and `F` key shortcut) to switch between an uncluttered cinematic 3D focus view and the full engineering telemetry control room.
- **Interactive 3D Digital Twin**: Continuous fast pyrolysis reactor, 800 °C solid ash combustor & reheater, twin screw biomass feeder, primary cyclone, secondary catalytic char bed, and fractional bio-oil condensation train.
- **Project & Materials Handbook**: Full in-app handbook explaining the purpose of each material (biomass feedstock, 800 °C solid ash heat carrier, catalytic biochar, HDO recycled syngas, upgraded bio-oil, auxiliary start-up fuel) and how the autothermal closed loop functions.
- **Dynamic Process Particle FX**: Real-time particle streams visualizing the recirculating solid heat carrier (ash), biomass injection, fluidized bubbling bed, pyrolysis vapors, syngas recirculation loop, and bio-oil collection.
- **On-Screen Materials & Process Streams Legend**: Collapsible live legend displaying color-coded streams with direct links to technical material specifications.
- **Live Engineering HUD & Telemetry**: Real-time temperature pyrometer, chemical yield distribution (bio-oil, biochar, syngas), autothermal energy balance (+4.39 GJ surplus), and system thermal efficiency (73.6%).
- **Interactive Controls & Experiments**: Modulate biomass feed rate, reactor setpoint temperature, combustor temperature, syngas ratio, and toggle in situ catalytic cracking and automatic vs manual PID+Fuzzy control. Includes 0.5x slow-motion mode for granular kinetic observation up to 10x acceleration.
- **Camera Views & Modes**: Preset camera views with smooth cinematic transition glides, Cutaway / X-Ray transparency mode, and thermal false-color heatmap view.
- **Keyboard Navigation**: Instant shortcuts (`1`-`6` for camera presets, `Space` to pause/resume, `T` for tour, `C` for AI Copilot, `F` for focus view, `G` for guide, `X` for cutaway, `M` for thermal, `P` for particles).
- **Data Export**: Direct in-browser export to time-series CSV and verification markdown reports.

---

## License

MIT License. See LICENSE for details.


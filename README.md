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

---

## License

MIT License. See LICENSE for details.

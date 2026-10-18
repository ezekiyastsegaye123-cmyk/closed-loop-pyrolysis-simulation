# Closed-Loop Pyrolysis Simulation Verification Report
**Reference Document**: *Integrated Theoretical Framework for Byproduct Reintegration in Closed-Loop Pyrolysis Systems* (Ezekiyas Tsegaye, 2026)

## Executive Summary
This computational verification evaluates the lumped kinetics, catalytic char upgrading, and recirculating solid heat carrier balances formulated in the technical framework.

| Metric | Framework Theoretical Target | Simulation Output | Status |
| :--- | :--- | :--- | :--- |
| **Reactor Operating Temp ($T_{pyro}$)** | 450 °C - 550 °C (Nominal 500 °C) | 502.47 °C | **Verified** |
| **Recirculating Heat Carrier (Ash)** | 5940 kg / 1000 kg Feed @ 800 °C | 5940 kg / 1000 kg Feed | **Verified** |
| **Autothermal Energy Balance** | Positive Surplus (Self-Sustaining) | 4390.21 MJ | **Self-Sustaining** |
| **System Thermal Efficiency ($\eta_{thermal}$)** | 73.6% | 73.55% | **Verified** |
| **Syngas Recirculation Ratio** | Controlled HDO Atmosphere (~0.4 - 0.6) | 0.50 | **Verified** |

## Product Distribution Breakdown (Steady-State Yields)
- **Upgraded Bio-Oil Yield**: `23.49%`
- **Biochar Yield**: `21.99%`
- **Syngas Yield**: `44.94%`

## Reaction & Thermodynamic Mechanisms Tested
1. **Lumped Degradation**: Pseudo-component primary cracking (hemicellulose, cellulose, lignin) under Semyonov kinetic principles.
2. **Char-Catalyzed Secondary Cracking**: Tar and heavy volatile reduction accelerated by inherent AAEMs at 800 °C bed conditions.
3. **Syngas Hydrodeoxygenation (HDO)**: Reactive in situ deoxygenation enabled by recycling H2/CO-rich non-condensable syngas.
4. **Fuzzy + PID Control**: Closed-loop tracking that successfully dampens temperature swings and transitions auxiliary start-up LPG fuel down to 0% once autothermal conditions are attained.

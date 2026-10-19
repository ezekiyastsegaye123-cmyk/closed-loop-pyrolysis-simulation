/**
 * Industrial UI Dashboard, Live Telemetry Charts,
 * Sliders, Event Handlers and Equipment Breakdown Modal
 */

export class DashboardUI {
  constructor(sim, sceneManager, controls) {
    this.sim = sim;
    this.sceneManager = sceneManager;
    this.controls = controls;

    this.chartCanvas = document.getElementById('telemetry-canvas');
    this.chartCtx = this.chartCanvas ? this.chartCanvas.getContext('2d') : null;

    this.bindInputs();
    this.bindButtons();
    this.bindModal();
  }

  bindInputs() {
    // Feed Rate Slider
    const feedInput = document.getElementById('feed-rate-slider');
    const feedVal = document.getElementById('feed-rate-val');
    if (feedInput) {
      feedInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        feedVal.textContent = `${val.toFixed(0)} kg/h`;
        this.sim.setFeedRate(val);
      });
    }

    // Setpoint Temp Slider
    const tempInput = document.getElementById('temp-setpoint-slider');
    const tempVal = document.getElementById('temp-setpoint-val');
    if (tempInput) {
      tempInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        tempVal.textContent = `${val.toFixed(1)} °C`;
        this.sim.setTargetTempC(val);
      });
    }

    // Combustor Temp Slider
    const combInput = document.getElementById('comb-temp-slider');
    const combVal = document.getElementById('comb-temp-val');
    if (combInput) {
      combInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        combVal.textContent = `${val.toFixed(0)} °C`;
        this.sim.setCombustorTempC(val);
      });
    }

    // Syngas Recirculation Slider
    const syngasInput = document.getElementById('syngas-ratio-slider');
    const syngasVal = document.getElementById('syngas-ratio-val');
    if (syngasInput) {
      syngasInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        syngasVal.textContent = val.toFixed(2);
        this.sim.setSyngasRatio(val);
      });
    }

    // Catalytic Char Bed Toggle
    const charToggle = document.getElementById('char-catalysis-toggle');
    if (charToggle) {
      charToggle.addEventListener('change', (e) => {
        this.sim.setCharCatalysis(e.target.checked);
      });
    }

    // Syngas HDO Recirculation Toggle
    const syngasToggle = document.getElementById('syngas-recirc-toggle');
    if (syngasToggle) {
      syngasToggle.addEventListener('change', (e) => {
        this.sim.setSyngasRecirc(e.target.checked);
      });
    }

    // Controller Mode Toggle (Auto Fuzzy+PID vs Manual)
    const modeToggle = document.getElementById('controller-mode-toggle');
    const manualGroup = document.getElementById('manual-trim-group');
    if (modeToggle) {
      modeToggle.addEventListener('change', (e) => {
        const manual = e.target.checked;
        this.sim.setManualMode(manual);
        if (manualGroup) manualGroup.style.display = manual ? 'block' : 'none';
      });
    }

    // Manual Trim Fuel Slider
    const manualTrimInput = document.getElementById('manual-trim-slider');
    const manualTrimVal = document.getElementById('manual-trim-val');
    if (manualTrimInput) {
      manualTrimInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        manualTrimVal.textContent = `${val.toFixed(0)} %`;
        this.sim.setManualTrimFuel(val);
      });
    }
  }

  bindButtons() {
    // Play / Pause
    const playBtn = document.getElementById('btn-play-pause');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        window.simulationRunning = !window.simulationRunning;
        playBtn.innerHTML = window.simulationRunning ? 
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause' : 
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume';
        playBtn.classList.toggle('active', window.simulationRunning);
      });
    }

    // Reset Simulation
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.sim.reset();
      });
    }

    // Simulation Speed Multipliers
    const speedButtons = document.querySelectorAll('.btn-speed');
    speedButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        speedButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        window.simulationSpeed = parseFloat(btn.dataset.speed || '1.0');
      });
    });

    // Camera Presets
    const presetButtons = document.querySelectorAll('.btn-preset');
    presetButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;
        this.controls.setPreset(view);
      });
    });

    // Visual Modes (Cutaway, Thermal Heatmap, Particles)
    const cutawayBtn = document.getElementById('btn-cutaway');
    if (cutawayBtn) {
      cutawayBtn.addEventListener('click', () => {
        const active = !cutawayBtn.classList.contains('active');
        cutawayBtn.classList.toggle('active', active);
        this.sceneManager.setCutawayMode(active);
      });
    }

    const thermalBtn = document.getElementById('btn-thermal');
    if (thermalBtn) {
      thermalBtn.addEventListener('click', () => {
        const active = !thermalBtn.classList.contains('active');
        thermalBtn.classList.toggle('active', active);
        this.sceneManager.setThermalHeatmapMode(active);
      });
    }

    const particlesBtn = document.getElementById('btn-particles');
    if (particlesBtn) {
      particlesBtn.addEventListener('click', () => {
        const active = !particlesBtn.classList.contains('active');
        particlesBtn.classList.toggle('active', active);
        if (window.particleStreams) {
          window.particleStreams.setVisible(active);
        }
      });
    }

    // Export CSV
    const exportCsvBtn = document.getElementById('btn-export-csv');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => this.exportCSV());
    }

    // Download Verification Report
    const reportBtn = document.getElementById('btn-download-report');
    if (reportBtn) {
      reportBtn.addEventListener('click', () => this.downloadReport());
    }
  }

  bindModal() {
    this.modal = document.getElementById('equipment-modal');
    this.modalTitle = document.getElementById('modal-title');
    this.modalTemp = document.getElementById('modal-temp');
    this.modalDesc = document.getElementById('modal-desc');
    this.modalFormula = document.getElementById('modal-formula');
    this.modalClose = document.getElementById('modal-close');

    if (this.modalClose && this.modal) {
      this.modalClose.addEventListener('click', () => {
        this.modal.classList.remove('open');
      });
    }
  }

  showEquipmentModal(info) {
    if (!this.modal) return;
    this.modalTitle.textContent = info.name || 'Equipment Inspection';
    this.modalTemp.textContent = info.tempTag || '';
    this.modalDesc.textContent = info.desc || '';

    const formulas = {
      reactor: `$$k_i(T) = A_i \\exp\\left(-\\frac{E_{a,i}}{R T}\\right)$$
$$\\text{Biomass} \\xrightarrow{\\Delta H = +1.0\\text{ MJ/kg}} \\text{Bio-oil Vapors} + \\text{Biochar} + \\text{Syngas}$$`,
      combustor: `$$Q_{\\text{delivered}} = \\dot{m}_{ash} C_{p,ash} (T_{\\text{comb}} - T_{\\text{pyro}})$$
$$\\dot{m}_{ash} = \\frac{1.69\\text{ GJ}}{950 \\times (1073 - 773)} \\approx 5,940\\text{ kg} / 1,000\\text{ kg feed}$$
$$\\text{Net Autothermal Energy: } +4,390.21\\text{ MJ (Self-Sustaining)}$$`,
      feeder: `$$\\dot{m}_{feed} = 1,000.0\\text{ kg/h (Baseline dry basis)}$$
$$\\text{Moisture Content} < 10\\text{ wt%}, \\quad d_p \\le 2\\text{ mm}$$`,
      separation: `$$\\text{Tar Cracking: } \\text{Heavy Aromatics} \\xrightarrow{\\text{AAEMs (Bed)}} \\text{Light Bio-oil} + \\text{CO} + \\text{H}_2$$
$$\\eta_{\\text{cyclone}} \\ge 98.5\\% \\text{ char capture}$$`,
      condenser: `$$\\tau_{\\text{vapor}} < 3.0\\text{ seconds rapid quench to prevent secondary repolymerization}$$
$$\\text{Upgraded Bio-oil Yield: } 23.49\\%, \\quad \\text{Thermal Efficiency: } 73.55\\%$$`
    };

    this.modalFormula.innerHTML = formulas[info.id] || 'Theoretical balance modeled according to Ezekiyas Tsegaye (2026).';
    this.modal.classList.add('open');
  }

  update(state) {
    // 1. Digital Telemetry Gauges
    const elTemp = document.getElementById('hud-temp');
    const elTempBadge = document.getElementById('hud-temp-badge');
    const elCombTemp = document.getElementById('hud-comb-temp');
    const elAshRate = document.getElementById('hud-ash-rate');
    const elAutothermal = document.getElementById('hud-autothermal');
    const elEfficiency = document.getElementById('hud-efficiency');
    const elTrimFuel = document.getElementById('hud-trim-fuel');

    if (elTemp) {
      elTemp.textContent = `${state.tempC.toFixed(1)} °C`;
      const diff = Math.abs(state.tempC - state.targetTempC);
      if (diff < 3.0) {
        elTempBadge.textContent = 'STEADY STATE';
        elTempBadge.className = 'status-tag status-success';
      } else {
        elTempBadge.textContent = 'HEATING / TRANSIENT';
        elTempBadge.className = 'status-tag status-warning';
      }
    }

    if (elCombTemp) elCombTemp.textContent = `${state.combustorTempC.toFixed(0)} °C`;
    if (elAshRate) elAshRate.textContent = `${state.ashCarrierRateKgHr.toFixed(0)} kg/h`;

    if (elAutothermal) {
      elAutothermal.textContent = `${state.autothermalMarginMJ > 0 ? '+' : ''}${state.autothermalMarginMJ.toFixed(1)} MJ/h`;
      elAutothermal.style.color = state.autothermalMarginMJ >= 0 ? '#10b981' : '#ef4444';
    }

    if (elEfficiency) elEfficiency.textContent = `${state.thermalEfficiency.toFixed(1)} %`;

    if (elTrimFuel) {
      elTrimFuel.textContent = `${state.trimFuelPct.toFixed(1)} %`;
      elTrimFuel.style.color = state.trimFuelPct > 1.0 ? '#f59e0b' : '#10b981';
    }

    // 2. Chemical Yields
    const elYieldOil = document.getElementById('yield-oil-val');
    const elYieldChar = document.getElementById('yield-char-val');
    const elYieldGas = document.getElementById('yield-gas-val');
    const barOil = document.getElementById('yield-oil-bar');
    const barChar = document.getElementById('yield-char-bar');
    const barGas = document.getElementById('yield-gas-bar');

    if (elYieldOil) elYieldOil.textContent = `${state.bioOilYieldPct.toFixed(1)}%`;
    if (elYieldChar) elYieldChar.textContent = `${state.charYieldPct.toFixed(1)}%`;
    if (elYieldGas) elYieldGas.textContent = `${state.gasYieldPct.toFixed(1)}%`;

    if (barOil) barOil.style.width = `${state.bioOilYieldPct}%`;
    if (barChar) barChar.style.width = `${state.charYieldPct}%`;
    if (barGas) barGas.style.width = `${state.gasYieldPct}%`;

    // 3. Render Canvas Chart
    this.renderChart();
  }

  renderChart() {
    if (!this.chartCtx || !this.sim.history.times.length) return;
    const ctx = this.chartCtx;
    const w = this.chartCanvas.width = this.chartCanvas.clientWidth;
    const h = this.chartCanvas.height = this.chartCanvas.clientHeight;

    ctx.clearRect(0, 0, w, h);

    const history = this.sim.history;
    const count = history.times.length;
    if (count < 2) return;

    // Draw grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += h / 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Scale helpers (Temp range: 350 to 550 °C)
    const minT = 350;
    const maxT = 550;
    const getY = (val) => h - ((val - minT) / (maxT - minT)) * (h - 20) - 10;
    const getX = (idx) => (idx / (count - 1)) * w;

    // Draw Setpoint Line (Dashed cyan)
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const x = getX(i);
      const y = getY(history.targetTemps[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Actual Temperature Curve (Solid Orange Glowing)
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const x = getX(i);
      const y = getY(history.temps[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  exportCSV() {
    const hist = this.sim.history;
    if (!hist.times.length) return;

    let csv = "Time (s),Reactor Temp (C),Target Temp (C),Bio-Oil Yield (%),Biochar Yield (%),Syngas Yield (%),Ash Carrier (kg/h),Autothermal Margin (MJ/h),Efficiency (%),Aux Fuel (%)\n";
    for (let i = 0; i < hist.times.length; i++) {
      csv += `${hist.times[i].toFixed(1)},${hist.temps[i].toFixed(2)},${hist.targetTemps[i].toFixed(1)},${hist.bioOilYields[i].toFixed(2)},${hist.charYields[i].toFixed(2)},${hist.gasYields[i].toFixed(2)},${hist.ashCarrierRates[i].toFixed(1)},${hist.autothermalMargins[i].toFixed(2)},${hist.efficiencies[i].toFixed(2)},${hist.trimFuels[i].toFixed(2)}\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `closed_loop_pyrolysis_simulation_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadReport() {
    const state = this.sim.lastState;
    const report = `# Closed-Loop Pyrolysis Simulation Live Verification Report
**Reference**: Integrated Theoretical Framework for Byproduct Reintegration in Closed-Loop Pyrolysis Systems (Ezekiyas Tsegaye, 2026)
**Execution Date**: ${new Date().toUTCString()}

## Current Operating Telemetry
- Biomass Feed Rate: ${this.sim.feedRate.toFixed(1)} kg/h
- Reactor Temperature: ${state.tempC.toFixed(2)} °C (Setpoint: ${state.targetTempC.toFixed(1)} °C)
- Combustor Temperature: ${state.combustorTempC.toFixed(1)} °C
- Recirculating Solid Heat Carrier (Ash): ${state.ashCarrierRateKgHr.toFixed(1)} kg/h
- Upgraded Bio-Oil Yield: ${state.bioOilYieldPct.toFixed(2)} %
- Biochar Yield: ${state.charYieldPct.toFixed(2)} %
- Non-condensable Syngas Yield: ${state.gasYieldPct.toFixed(2)} %
- Autothermal Energy Surplus: ${state.autothermalMarginMJ.toFixed(2)} MJ/h (Self-Sustaining: ${state.isAutothermal})
- System Thermal Efficiency: ${state.thermalEfficiency.toFixed(2)} %
- Auxiliary Start-up Fuel Throttle: ${state.trimFuelPct.toFixed(2)} %
`;

    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VERIFICATION_REPORT_EXPORT_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

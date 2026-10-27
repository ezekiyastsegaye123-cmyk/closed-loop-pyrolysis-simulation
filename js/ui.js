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
    this.bindGuideAndTour();
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

    const materialsMap = {
      reactor: `<strong>IN:</strong> Biomass Feed (1,000 kg/h, 25 °C) + Hot Ash Carrier (5,940 kg/h, 800 °C) + Recycled Syngas (HDO Atmosphere).<br>
<strong>OUT:</strong> Hot Volatile Vapors (500 °C) + Entrained Biochar (220 kg/h) + Spent Ash Carrier (5,940 kg/h, 500 °C).<br>
<strong>Purpose:</strong> Fast thermal cracking at 500 °C in an oxygen-free bubbling bed. Sensible heat from ash powers the endothermic reaction (+1.0 MJ/kg) with zero fuel combustion inside the vessel.`,
      combustor: `<strong>IN:</strong> Byproduct Biochar (154 kg/h, 70% of char yield) + Excess Syngas (50%) + Spent Ash Carrier (5,940 kg/h, 500 °C).<br>
<strong>OUT:</strong> Reheated Solid Ash Carrier (5,940 kg/h, 800 °C) + Clean Flue Stack Gas.<br>
<strong>Purpose:</strong> Byproduct combustion releases 3,388 MJ/h from char, reheating circulating ash back to 800 °C. Delivers a <strong>+4,390 MJ/h autothermal surplus</strong>, reducing auxiliary fossil fuel down to 0.0%.`,
      feeder: `<strong>IN:</strong> Raw Dried Biomass chips/sawdust (Moisture &lt; 10 wt%, d<sub>p</sub> &le; 2 mm).<br>
<strong>OUT:</strong> Continuous Metered Stream (1,000 kg/h dry basis).<br>
<strong>Purpose:</strong> Feeds renewable solid polymers (cellulose, hemicellulose, lignin) into the reactor under an airtight seal to exclude atmospheric oxygen.`,
      separation: `<strong>IN:</strong> Hot Pyrolysis Vapors & Entrained Char from Reactor Core.<br>
<strong>OUT:</strong> Separated Char (98.5% recovery) + Tar-Cracked Upgraded Vapors.<br>
<strong>Purpose:</strong> Cyclone captures char; vapors pass through the secondary char bed where inherent alkaline metals (AAEMs: K, Ca, Mg) catalytically crack heavy tars into light condensable fuels.`,
      condenser: `<strong>IN:</strong> Hot Upgraded Pyrolysis Vapors (500 °C) from Catalytic Bed.<br>
<strong>OUT:</strong> Upgraded Bio-Oil (235 kg/h, 23.5% yield) + Non-condensable Syngas (H<sub>2</sub> / CO rich).<br>
<strong>Purpose:</strong> Rapid multi-stage quench (&lt;3s) captures stabilized, high-calorific bio-oil (~28 MJ/kg). Syngas is separated for HDO loop and combustion.`
    };

    const matContentEl = document.getElementById('modal-materials-content');
    if (matContentEl) {
      matContentEl.innerHTML = materialsMap[info.id] || 'Materials flow modeled according to Ezekiyas Tsegaye (2026).';
    }

    const formulas = {
      reactor: `$$k_i(T) = A_i \\exp\\left(-\\frac{E_{a,i}}{R T}\\right)$$
$$\\text{Biomass} \\xrightarrow{\\Delta H = +1.0\\text{ MJ/kg}} \\text{Bio-oil Vapors} + \\text{Biochar} + \\text{Syngas}$$`,
      combustor: `$$Q_{\\text{delivered}} = \\dot{m}_{ash} C_{p,ash} (T_{\\text{comb}} - T_{\\text{pyro}})$$
$$\\dot{m}_{ash} = \\frac{1.69\\text{ GJ}}{950 \\times (1073 - 773)} \\approx 5,940\\text{ kg} / 1,000\\text{ kg feed}$$
$$\\text{Net Autothermal Energy: } +4,390.21\\text{ MJ/h (Self-Sustaining, 0.0% Fossil Fuel)}$$`,
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

  bindGuideAndTour() {
    this.tourCard = document.getElementById('tour-card');
    this.tourProgressFill = document.getElementById('tour-progress-fill');
    this.tourStepBadge = document.getElementById('tour-step-badge');
    this.tourTitle = document.getElementById('tour-step-title');
    this.tourSubtitle = document.getElementById('tour-step-subtitle');
    this.tourMaterialText = document.getElementById('tour-material-text');
    this.tourContent = document.getElementById('tour-step-content');
    this.tourTip = document.getElementById('tour-step-tip');
    this.tourDotsContainer = document.getElementById('tour-dots');
    this.btnTourPrev = document.getElementById('btn-tour-prev');
    this.btnTourNext = document.getElementById('btn-tour-next');
    this.btnTourClose = document.getElementById('btn-tour-close');

    this.guideModal = document.getElementById('guide-modal');
    this.guideBackdrop = document.getElementById('guide-backdrop');
    this.btnGuideClose = document.getElementById('btn-guide-close');

    this.welcomeBanner = document.getElementById('welcome-banner');

    this.tourSteps = [
      {
        id: 'overview',
        preset: 'overview',
        badge: 'STEP 1 OF 7 · OVERVIEW',
        title: 'Welcome to Closed-Loop Pyrolysis',
        subtitle: 'System Overview & Autothermal Innovation',
        material: 'Focus: 100% Closed-Loop Byproduct Reintegration',
        content: 'Welcome! Conventional fast pyrolysis requires burning huge amounts of external fossil fuel and generates acidic, tar-heavy crude bio-oil. This 3D digital twin models Ezekiyas Tsegaye\'s (2026) framework, where all process byproducts (solid ash heat, biochar catalyst, and syngas) are recycled back into the system to achieve 100% autothermal self-sufficiency (+4.39 GJ surplus) with zero fossil fuels!',
        tip: '💡 Click "Next Stage" or press Right Arrow on your keyboard to tour each component!'
      },
      {
        id: 'feeder',
        preset: 'feeder',
        badge: 'STEP 2 OF 7 · FEEDSTOCK',
        title: 'Stage 1: Biomass Metering & Feed Material',
        subtitle: 'Raw Renewable Hydrocarbon Input',
        material: 'Material: Dry Biomass (Cellulose 45%, Hemicellulose 30%, Lignin 25%)',
        content: 'The process starts with dry plant biomass (forestry wood chips, sawdust, or crop residue with <10% moisture and particles ≤2 mm). Dual variable-speed screw augers meter 1,000 kg/h continuously into the reactor while maintaining an airtight inert gas seal to exclude atmospheric oxygen.',
        tip: '💡 Purpose of Biomass: Acts as the carbon-neutral source of organic biopolymers for thermochemical conversion into liquid biofuels.'
      },
      {
        id: 'reactor',
        preset: 'reactor',
        badge: 'STEP 3 OF 7 · REACTOR CORE',
        title: 'Stage 2: Fluidized Bed Fast Pyrolysis Reactor',
        subtitle: 'Rapid Thermal Cracking @ 500 °C in <2 Seconds',
        material: 'Material: Fluidized Sand & Red-Hot Solid Ash Carrier (800 °C)',
        content: 'Inside this oxygen-free vessel, falling biomass mixes with 800 °C recirculating solid ash. Within 2 seconds, cellulose, hemicellulose, and lignin decompose under Semyonov kinetics into volatile primary bio-oil vapors, solid biochar, and syngas, requiring +1.0 MJ/kg of endothermic sensible heat.',
        tip: '💡 Purpose of Reactor: Extremely rapid conductive heating (>1000 °C/s) prevents charring and maximizes volatile bio-oil vapor yield.'
      },
      {
        id: 'combustor',
        preset: 'combustor',
        badge: 'STEP 4 OF 7 · HEAT CARRIER LOOP',
        title: 'Stage 3: Ash Combustor & Solid Heat Carrier Loop',
        subtitle: 'The Engine of Autothermal Operation (+4.39 GJ Surplus)',
        material: 'Material: 5,940 kg/h Solid Ash Carrier (800 °C) & Byproduct Biochar',
        content: 'The core innovation: instead of burning fossil gas or electricity, this vessel burns 70% of the byproduct char and surplus syngas to reheat 5,940 kg/h of solid mineral ash back to 800 °C. The hot ash flows through the upper riser into the reactor, delivering 1.69 GJ of sensible heat and driving auxiliary start-up fuel down to 0.0%!',
        tip: '💡 Purpose of Ash Carrier: Acts as a continuous sensible heat sponge, replacing combustion tubes and eliminating heat-exchanger fouling.'
      },
      {
        id: 'separation',
        preset: 'separation',
        badge: 'STEP 5 OF 7 · CATALYTIC UPGRADING',
        title: 'Stage 4: Cyclone Separator & Catalytic Biochar Bed',
        subtitle: 'Cracking Heavy Tars with Active Char Minerals (AAEMs)',
        material: 'Material: Biochar with Inherent Alkali & Alkaline Earth Metals (AAEMs)',
        content: 'The primary cyclone separates 98.5% of entrained biochar from the vapor stream. The vapors then pass through a secondary hot biochar bed. Inherent alkali and alkaline earth metals (K, Ca, Mg) in the char act as a zero-cost catalyst, selectively cracking heavy polycyclic tars into light, high-value liquid fuels and preventing wax deposits.',
        tip: '💡 Purpose of Biochar: Reheating fuel for the combustor (70%) and porous in-situ catalytic cracker for heavy tars (30%).'
      },
      {
        id: 'condenser',
        preset: 'condenser',
        badge: 'STEP 6 OF 7 · CONDENSATION & PRODUCTS',
        title: 'Stage 5: Fractional Condensers & Syngas HDO Loop',
        subtitle: 'Capturing Stabilized Bio-Oil & Recycling Reducing Syngas',
        material: 'Material: Upgraded Bio-Oil (23.5%) & Recycled Syngas (H₂ / CO)',
        content: 'Pyrolysis vapors are rapidly quenched (<3s) across shell-and-tube coolers and an electrostatic precipitator, capturing premium stabilized bio-oil (23.5% yield). 50% of the non-condensable syngas (H₂/CO rich) is recycled into the reactor base to create an in-situ hydrodeoxygenation (HDO) atmosphere, stripping oxygen from vapors to prevent oil acidity.',
        tip: '💡 Purpose of Syngas: Deoxygenates bio-oil for long-term shelf stability without buying expensive hydrogen gas.'
      },
      {
        id: 'ready',
        preset: 'overview',
        badge: 'STEP 7 OF 7 · CONTROLS & EXPERIMENTS',
        title: 'Stage 6: You\'re Ready to Explore & Experiment!',
        subtitle: 'How to Interact with the Digital Twin',
        material: 'Controls: Sliders, Preset Cameras, X-Ray & Data Exports',
        content: 'You now know the entire closed loop! Click & drag anywhere in 3D to rotate, right-click to pan, and click any vessel to inspect formulas. Use the right sidebar sliders to modulate Feed Rate, Setpoints, and Syngas Ratio. Toggle Char Catalysis or test Manual Burner Control to watch real-time chemical responses!',
        tip: '💡 Click "Project & Materials Guide" in the top header at any time for the full technical handbook!'
      }
    ];

    this.currentTourStep = 0;
    this.isTourActive = false;

    // Build tour dots
    if (this.tourDotsContainer) {
      this.tourDotsContainer.innerHTML = '';
      this.tourSteps.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = `tour-dot ${idx === 0 ? 'active' : ''}`;
        dot.setAttribute('title', `Go to Step ${idx + 1}`);
        dot.addEventListener('click', () => this.goToTourStep(idx));
        this.tourDotsContainer.appendChild(dot);
      });
    }

    // Bind Tour Launchers
    const btnStartTour = document.getElementById('btn-start-tour');
    const btnWelcomeTour = document.getElementById('btn-welcome-tour');
    const btnGuideStartTour = document.getElementById('btn-guide-start-tour');

    [btnStartTour, btnWelcomeTour, btnGuideStartTour].forEach(btn => {
      if (btn) btn.addEventListener('click', () => {
        this.closeGuide();
        this.dismissWelcomeBanner();
        this.startTour();
      });
    });

    if (this.btnTourNext) {
      this.btnTourNext.addEventListener('click', () => this.nextTourStep());
    }
    if (this.btnTourPrev) {
      this.btnTourPrev.addEventListener('click', () => this.prevTourStep());
    }
    if (this.btnTourClose) {
      this.btnTourClose.addEventListener('click', () => this.endTour());
    }

    // Bind Guide Modal Buttons
    const btnOpenGuide = document.getElementById('btn-open-guide');
    const btnWelcomeGuide = document.getElementById('btn-welcome-guide');
    const btnModalOpenGuide = document.getElementById('btn-modal-open-guide');

    if (btnOpenGuide) btnOpenGuide.addEventListener('click', () => this.openGuide('tab-overview'));
    if (btnWelcomeGuide) btnWelcomeGuide.addEventListener('click', () => {
      this.dismissWelcomeBanner();
      this.openGuide('tab-overview');
    });
    if (btnModalOpenGuide) btnModalOpenGuide.addEventListener('click', () => {
      if (this.modal) this.modal.classList.remove('open');
      this.openGuide('tab-materials');
    });

    if (this.btnGuideClose) {
      this.btnGuideClose.addEventListener('click', () => this.closeGuide());
    }
    if (this.guideBackdrop) {
      this.guideBackdrop.addEventListener('click', () => this.closeGuide());
    }

    // Welcome Banner dismiss buttons
    const btnWelcomeDismiss = document.getElementById('btn-welcome-dismiss');
    const btnWelcomeClose = document.getElementById('btn-welcome-close');
    if (btnWelcomeDismiss) btnWelcomeDismiss.addEventListener('click', () => this.dismissWelcomeBanner());
    if (btnWelcomeClose) btnWelcomeClose.addEventListener('click', () => this.dismissWelcomeBanner());

    // Guide Tabs switching
    const tabBtns = document.querySelectorAll('.guide-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        this.switchGuideTab(targetTab);
      });
    });

    // Materials Legend toggle & item click
    const legendHeader = document.getElementById('legend-header-toggle');
    const materialsLegend = document.getElementById('materials-legend');
    if (legendHeader && materialsLegend) {
      legendHeader.addEventListener('click', (e) => {
        materialsLegend.classList.toggle('collapsed');
        const toggleBtn = document.getElementById('btn-toggle-legend');
        if (toggleBtn) {
          toggleBtn.textContent = materialsLegend.classList.contains('collapsed') ? '+' : '−';
        }
      });
    }

    const legendItems = document.querySelectorAll('.legend-item');
    legendItems.forEach(item => {
      item.addEventListener('click', () => {
        const mat = item.dataset.material;
        this.openGuide('tab-materials');
        setTimeout(() => {
          const map = {
            'biomass': 'mat-biomass',
            'ash-hot': 'mat-ash-hot',
            'ash-spent': 'mat-ash-hot',
            'vapors': 'mat-bio-oil',
            'syngas': 'mat-syngas',
            'bio-oil': 'mat-bio-oil'
          };
          const targetId = map[mat] || 'mat-biomass';
          const targetCard = document.getElementById(targetId);
          if (targetCard) targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 120);
      });
    });

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        const playBtn = document.getElementById('btn-play-pause');
        if (playBtn) playBtn.click();
      } else if (e.key === 'r' || e.key === 'R') {
        const resetBtn = document.getElementById('btn-reset');
        if (resetBtn) resetBtn.click();
      } else if (e.key === 't' || e.key === 'T') {
        this.startTour();
      } else if (e.key === 'g' || e.key === 'G') {
        if (this.guideModal && this.guideModal.style.display !== 'none') {
          this.closeGuide();
        } else {
          this.openGuide('tab-overview');
        }
      } else if (e.key === 'x' || e.key === 'X') {
        const cutBtn = document.getElementById('btn-cutaway');
        if (cutBtn) cutBtn.click();
      } else if (e.key === 'm' || e.key === 'M') {
        const thermBtn = document.getElementById('btn-thermal');
        if (thermBtn) thermBtn.click();
      } else if (e.key === 'p' || e.key === 'P') {
        const partBtn = document.getElementById('btn-particles');
        if (partBtn) partBtn.click();
      } else if (e.key === 'Escape') {
        if (this.isTourActive) this.endTour();
        this.closeGuide();
        if (this.modal) this.modal.classList.remove('open');
      } else if (e.key >= '1' && e.key <= '6') {
        const presets = ['overview', 'reactor', 'combustor', 'feeder', 'separation', 'condenser'];
        const presetName = presets[parseInt(e.key) - 1];
        if (presetName) {
          const btn = document.querySelector(`.btn-preset[data-view="${presetName}"]`);
          if (btn) btn.click();
        }
      } else if (this.isTourActive) {
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
          this.nextTourStep();
        } else if (e.key === 'ArrowLeft') {
          this.prevTourStep();
        }
      }
    });

    // Check if previously dismissed
    try {
      if (sessionStorage.getItem('pyrolysis_welcome_dismissed') && this.welcomeBanner) {
        this.welcomeBanner.style.display = 'none';
      }
    } catch (e) {}
  }

  dismissWelcomeBanner() {
    if (this.welcomeBanner) {
      this.welcomeBanner.classList.add('dismissed');
      setTimeout(() => this.welcomeBanner.style.display = 'none', 320);
      try {
        sessionStorage.setItem('pyrolysis_welcome_dismissed', 'true');
      } catch (e) {}
    }
  }

  startTour() {
    this.isTourActive = true;
    this.currentTourStep = 0;
    if (this.tourCard) this.tourCard.style.display = 'block';
    this.renderTourStep(0);
  }

  renderTourStep(idx) {
    if (!this.tourSteps[idx]) return;
    const step = this.tourSteps[idx];
    this.currentTourStep = idx;

    if (this.tourStepBadge) this.tourStepBadge.textContent = step.badge;
    if (this.tourTitle) this.tourTitle.textContent = step.title;
    if (this.tourSubtitle) this.tourSubtitle.textContent = step.subtitle;
    if (this.tourMaterialText) this.tourMaterialText.textContent = step.material;
    if (this.tourContent) this.tourContent.textContent = step.content;
    if (this.tourTip) this.tourTip.textContent = step.tip;

    // Progress bar & buttons
    const pct = ((idx + 1) / this.tourSteps.length) * 100;
    if (this.tourProgressFill) this.tourProgressFill.style.width = `${pct}%`;

    if (this.btnTourPrev) this.btnTourPrev.disabled = (idx === 0);
    if (this.btnTourNext) {
      if (idx === this.tourSteps.length - 1) {
        this.btnTourNext.textContent = 'Finish Tour 🚀';
        this.btnTourNext.classList.remove('btn-tour-pulse');
        this.btnTourNext.classList.add('active');
      } else {
        this.btnTourNext.textContent = 'Next Stage →';
        this.btnTourNext.classList.add('btn-tour-pulse');
        this.btnTourNext.classList.remove('active');
      }
    }

    // Dots
    if (this.tourDotsContainer) {
      const dots = this.tourDotsContainer.querySelectorAll('.tour-dot');
      dots.forEach((dot, dIdx) => {
        dot.classList.toggle('active', dIdx === idx);
      });
    }

    // Fly camera smoothly to the step's preset
    if (this.controls && step.preset) {
      this.controls.setPreset(step.preset);
      const presetButtons = document.querySelectorAll('.btn-preset');
      presetButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === step.preset);
      });
    }
  }

  nextTourStep() {
    if (this.currentTourStep < this.tourSteps.length - 1) {
      this.renderTourStep(this.currentTourStep + 1);
    } else {
      this.endTour();
    }
  }

  prevTourStep() {
    if (this.currentTourStep > 0) {
      this.renderTourStep(this.currentTourStep - 1);
    }
  }

  goToTourStep(idx) {
    if (idx >= 0 && idx < this.tourSteps.length) {
      this.renderTourStep(idx);
    }
  }

  endTour() {
    this.isTourActive = false;
    if (this.tourCard) this.tourCard.style.display = 'none';
  }

  openGuide(tabId = 'tab-overview') {
    if (this.guideBackdrop) this.guideBackdrop.style.display = 'block';
    if (this.guideModal) this.guideModal.style.display = 'flex';
    this.switchGuideTab(tabId);
  }

  closeGuide() {
    if (this.guideBackdrop) this.guideBackdrop.style.display = 'none';
    if (this.guideModal) this.guideModal.style.display = 'none';
  }

  switchGuideTab(tabId) {
    const tabBtns = document.querySelectorAll('.guide-tab-btn');
    const tabPanes = document.querySelectorAll('.guide-tab-pane');

    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });
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

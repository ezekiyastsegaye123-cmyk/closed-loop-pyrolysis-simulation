/**
 * AI Process Copilot & Offline Knowledge Engine
 * Implements an interactive assistant that explains closed-loop pyrolysis
 * to consumers and engineers with 3D camera navigation and audio narration.
 * Supports direct client-side Google Gemini connection via Bring-Your-Own-Key
 * as well as serverless /api/chat and local offline knowledge base fallback.
 */

export const SYSTEM_PROMPT = `
You are the AI Process Copilot for the Closed-Loop Pyrolysis 3D Digital Twin, an interactive industrial biorefinery simulation implementing the mathematical formulation in:
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
`;

export const PYROLYSIS_KNOWLEDGE = [
  {
    id: 'closed_loop_concept',
    title: 'Closed-Loop Pyrolysis Concept',
    keywords: ['closed loop', 'what is', 'how does it work', 'overview', 'concept', 'process', 'pyrolysis'],
    summary: `**Closed-loop pyrolysis** is an advanced green thermal conversion process. It turns raw biomass (like woodchips, sawdust, or agricultural residues) into clean renewable fuel and valuable materials without requiring continuous external heating.

Think of it like a **self-heating energy wheel**: after an initial gentle warm-up, the plant burns a small fraction of its own generated byproduct (residual char) inside an 800 °C combustor. The hot solid ash is cycled right back into the reactor to continuously bake incoming woodchips, and the produced syngas is recycled to purify the oil. Nothing is wasted!`,
    technical: `**Mathematical & Thermodynamic Basis:**
- **Reactor Temperature ($T_{pyro}$):** 500 °C nominal (range 450 – 550 °C).
- **Residence Time:** Vapors $\\tau_v < 2.0\\text{ s}$; Solids $\\tau_s > 300\\text{ s}$.
- **Mass Yields:** Bio-oil 65 wt%, Biochar 18 wt%, Syngas 17 wt%.
- **Autothermal Steady-State:** External fuel input $Q_{aux} \\rightarrow 0\\text{ kW}$. System thermal efficiency reaches **73.55%**.`,
    equipment: 'reactor',
    equipmentName: 'Fast Pyrolysis Reactor'
  },
  {
    id: 'autothermal_heat_carrier',
    title: '800 °C Solid Ash Heat Carrier & Autothermal Loop',
    keywords: ['heat carrier', 'ash', '800', 'combustor', 'energy balance', 'surplus', 'self sustaining', 'autothermal', 'heat'],
    summary: `In traditional pyrolysis plants, external fossil fuels (like natural gas or electricity) are constantly burned to supply heat. In this **closed-loop system**, we eliminate fossil fuels entirely!

The plant uses clean mineral ash and residual char as a **recirculating solid heat carrier**. Inside the combustor at 800 °C, the ash absorbs thermal energy from residual char oxidation. It then flows into the reactor at 500 °C to transfer heat directly to fresh biomass before returning to be reheated. The system actually produces a **+4.39 GJ/h net energy surplus**!`,
    technical: `**Heat Balance Formulation:**
- **Heat Carrier Circulation Rate:** $5,940\\text{ kg}/\\text{h}$ of ash per $1,000\\text{ kg}/\\text{h}$ dry biomass feed.
- **Heat Supplied by Carrier:** $\\dot{Q}_{carrier} = \\dot{m}_{ash} \\cdot C_{p,ash} \\cdot (T_{comb} - T_{pyro}) = 5,940 \\cdot 1.05 \\cdot (800 - 500) \\approx 1,871\\text{ MJ/h}$.
- **Pyrolysis Reaction Enthalpy:** $\\Delta H_{rxn} = 1,120\\text{ MJ/h}$ (endothermic requirement).
- **Combustor Char Release:** $Q_{char} = 4,460\\text{ MJ/h}$ at complete combustion.
- **Surplus Thermal Energy:** $+4,390.21\\text{ MJ/h}$ available for plant utility or district heating.`,
    equipment: 'combustor',
    equipmentName: '800 °C Solid Ash Combustor & Reheater'
  },
  {
    id: 'syngas_hdo',
    title: 'Syngas Recirculation & In-Situ HDO',
    keywords: ['syngas', 'hdo', 'hydrodeoxygenation', 'gas', 'recirculation', 'hydrogen', 'co', 'recycle', 'stability'],
    summary: `Raw pyrolysis oil is usually very acidic, watery, and prone to aging because it contains excessive oxygen. 

To solve this, our closed-loop system captures the non-condensable **syngas** ($H_2$ and $CO$) coming out of the condenser and blows a controlled fraction ($50\\%$) directly back into the reactor! This creates a mild **reactive hydrogen-rich atmosphere** that strips away unwanted oxygen (Hydrodeoxygenation / HDO), transforming raw vapor into higher-grade, stable biofuel.`,
    technical: `**HDO Recirculation Dynamics:**
- **Recirculation Ratio ($R_{syngas}$):** Controlled between $0.40 - 0.60$ (nominal setpoint $0.50$).
- **Syngas Composition:** $H_2$ (18-24 vol%), $CO$ (35-42 vol%), $CO_2$ (20-25 vol%), $CH_4$ (8-12 vol%).
- **Deoxygenation Pathway:** Active $H_2$ cleavage of methoxy and hydroxyl functional groups: $\\text{R-OH} + H_2 \\rightarrow \\text{R-H} + H_2O$.
- **Bio-Oil Quality Impact:** Lowers Total Acid Number (TAN) by ~38% and increases Higher Heating Value (HHV) to $22.4\\text{ MJ/kg}$.`,
    equipment: 'condenser',
    equipmentName: 'Syngas Recirculation & Condensation Train'
  },
  {
    id: 'catalytic_char',
    title: 'In-Situ Biochar Catalytic Upgrading',
    keywords: ['char', 'catalytic', 'cracking', 'aaem', 'secondary cracking', 'tar', 'metals', 'potassium', 'calcium'],
    summary: `Biochar isn't just a byproduct—it's a **natural high-temperature catalyst**!

When wood is pyrolyzed, the resulting porous biochar retains natural minerals called **AAEMs** (alkali and alkaline earth metals, mainly potassium and calcium). As raw tar vapors flow through the biochar bed in the primary separation cyclone, these mineral sites crack heavy, sticky tar molecules into lighter, clean bio-oil vapors. This prevents pipeline clogging and upgrades oil quality naturally without expensive artificial catalysts.`,
    technical: `**Catalytic Kinetics & AAEM Mechanism:**
- **Active AAEM Content:** Potassium ($K^+$), Calcium ($Ca^{2+}$), Magnesium ($Mg^{2+}$) within biochar matrix.
- **Secondary Tar Cracking Reaction:** $\\text{Tar}_{heavy} \\xrightarrow{k_{sec}(AAEM)} \\text{Bio-oil}_{light} + \\text{Syngas} + \\text{Coke}$.
- **Apparent Activation Energy:** Reduced from $92.4\\text{ kJ/mol}$ (uncatalyzed) to $58.1\\text{ kJ/mol}$ over active biochar.
- **Heavy Tar Reduction:** Greater than $42\\%$ reduction in polycyclic aromatic hydrocarbons (PAHs).`,
    equipment: 'separation',
    equipmentName: 'Primary Cyclone & Catalytic Char Bed'
  },
  {
    id: 'feedstock_injection',
    title: 'Feedstock Injection & Twin Screw Feeder',
    keywords: ['feed', 'biomass', 'feeder', 'screw', 'wood', 'raw material', 'injection', 'hopper'],
    summary: `The process begins at the **Twin Screw Biomass Feeder**. Dry biomass pellets or woodchips (typically $<2\\text{ mm}$ particle size and $<10\\%$ moisture) are metered into the pressurized injection tube.

Dual counter-rotating water-cooled screws inject the woodchips directly into the bottom of the fluidized bed in fractions of a second to prevent early pre-pyrolysis melting or plugging.`,
    technical: `**Feed Specifications & Dynamics:**
- **Nominal Feed Rate:** $1,000\\text{ kg/h}$ dry woody biomass.
- **Moisture Limit:** $\\leq 10\\text{ wt}\\%$ to avoid quench cooling and phase separation.
- **Biomass Composition:** Cellulose $45\\%$, Hemicellulose $30\\%$, Lignin $25\\%$.
- **Rapid Heating Rate:** $>1,000\\text{ }^\\circ\\text{C/s}$ achieved upon instant contact with the 800 °C ash heat carrier.`,
    equipment: 'feeder',
    equipmentName: 'Twin Screw Biomass Feeder'
  },
  {
    id: 'bio_oil_products',
    title: 'Product Outputs: Bio-Oil, Biochar, and Syngas',
    keywords: ['products', 'bio-oil', 'biochar', 'output', 'yield', 'use', 'what is made', 'renewable', 'fuel'],
    summary: `From $1,000\\text{ kg}$ of dry biomass feedstock per hour, the system produces:
1. **Upgraded Bio-Oil (~650 kg/h)**: A dense, dark amber liquid fuel for industrial heating, marine vessels, or refining into renewable aviation fuel (SAF).
2. **High-Porosity Biochar (~180 kg/h)**: A carbon-negative soil amendment that locks away carbon for centuries while boosting soil fertility.
3. **Clean Syngas (~170 kg/h)**: Used internally for HDO deoxygenation and powering combustor start-up.`,
    technical: `**Elemental & Energy Yields:**
- **Bio-Oil HHV:** $21.5 - 23.0\\text{ MJ/kg}$ (vs $16.5\\text{ MJ/kg}$ in raw pyrolysis).
- **Water Content:** Reduced to $<18\\text{ wt}\\%$ via fractional condensation.
- **Biochar Carbon Content:** $>82\\text{ wt}\\%$ fixed carbon, BET Surface Area $>320\\text{ m}^2/\\text{g}$.
- **Net Carbon Balance:** Negative carbon footprint ($-0.85\\text{ kg CO}_2\\text{ eq} / \\text{kg feed}$) due to permanent biochar carbon sequestration.`,
    equipment: 'condenser',
    equipmentName: 'Fractional Condensation Train'
  },
  {
    id: 'environmental_benefits',
    title: 'Zero-Waste & Circular Economy Impact',
    keywords: ['environment', 'zero waste', 'green', 'sustainability', 'carbon', 'circular', 'fossil fuel', 'emissions'],
    summary: `This closed-loop system is designed as a **zero-waste circular bio-refinery**:
- **Zero External Fuel in Operation**: The system heats itself entirely using internal byproduct energy.
- **Zero Solid Waste**: The mineral ash serves as the heat carrier; the biochar is sold for regenerative agriculture or carbon credits.
- **Net Carbon Negative**: Because plants absorb atmospheric $CO_2$ while growing and the biochar locks that carbon in the ground permanently, the overall process actively removes carbon from the atmosphere!`,
    technical: `**Life Cycle Assessment (LCA) Highlights:**
- **Carbon Sequestration:** $1.42\\text{ tonnes CO}_2\\text{ eq}$ sequestered per tonne of dry biochar applied to soil.
- **Avoided Fossil Emissions:** Replaces heavy fuel oil ($3.12\\text{ kg CO}_2 / \\text{kg HFO}$).
- **Net Thermal Efficiency:** $\\eta = 73.55\\%$, surpassing conventional standalone fast pyrolysis ($58-64\\%$).`,
    equipment: 'combustor',
    equipmentName: 'Combustor & Closed-Loop Cycle'
  }
];

export class AIChatCopilot {
  constructor(sceneControls, plantScene, sim) {
    this.controls = sceneControls;
    this.plantScene = plantScene;
    this.sim = sim;

    this.isOpen = false;
    this.isTTSActive = false;
    this.messages = [];
    this.synth = (typeof window !== 'undefined' && window.speechSynthesis) ? window.speechSynthesis : null;
    this.isLLMConnected = false;

    if (typeof document !== 'undefined') {
      this.createDOM();
      this.bindEvents();
      this.showWelcomeMessage();
      this.initConnectionStatus();
    }
  }

  getStoredApiKey() {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem('pyrolysis_gemini_api_key') || '';
  }

  setStoredApiKey(key) {
    if (typeof localStorage === 'undefined') return;
    if (key) {
      localStorage.setItem('pyrolysis_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('pyrolysis_gemini_api_key');
    }
  }

  async initConnectionStatus() {
    const userKey = this.getStoredApiKey();
    if (userKey) {
      this.updateStatusBadge(true, 'Gemini 1.5 Flash Connected');
      return;
    }

    // Check backend server status
    try {
      const res = await fetch('/api/status', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        if (data.gemini_connected) {
          this.updateStatusBadge(true, 'Server Gemini LLM Active');
          return;
        }
      }
    } catch (e) {
      // ignore
    }

    this.updateStatusBadge(false, 'Offline Knowledge · Click ⚙️ to Connect');
  }

  updateStatusBadge(isConnected, label) {
    this.isLLMConnected = isConnected;
    const dot = this.drawerEl ? this.drawerEl.querySelector('.status-dot') : null;
    const text = this.drawerEl ? this.drawerEl.querySelector('#ai-status-text') : null;
    if (dot) {
      dot.className = `status-dot ${isConnected ? 'online' : 'offline'}`;
    }
    if (text) {
      text.textContent = label;
    }
  }

  createDOM() {
    // 1. Floating Toggle Launcher Button
    const launcher = document.createElement('button');
    launcher.id = 'ai-chat-launcher';
    launcher.className = 'ai-chat-launcher-btn';
    launcher.title = 'Open AI Process Copilot (Press C)';
    launcher.setAttribute('aria-label', 'Open AI Process Copilot');
    launcher.innerHTML = `
      <div class="ai-launcher-icon-wrapper">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM4.93 4.93a2 2 0 0 1 2.83 0l1.41 1.41a2 2 0 0 1-2.83 2.83L4.93 7.76a2 2 0 0 1 0-2.83zM2 12a2 2 0 0 1 2-2h2a2 2 0 0 1 0 4H4a2 2 0 0 1-2-2zm16 0a2 2 0 0 1 2-2h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-2-2zm-7 4a5 5 0 0 1-5-5h10a5 5 0 0 1-5 5zm-3 4a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1z"/>
        </svg>
        <span class="ai-launcher-pulse"></span>
      </div>
      <span class="ai-launcher-label">AI Copilot</span>
    `;
    document.body.appendChild(launcher);
    this.launcherEl = launcher;

    // 2. Chat Drawer Window
    const drawer = document.createElement('div');
    drawer.id = 'ai-chat-drawer';
    drawer.className = 'ai-chat-drawer';
    drawer.innerHTML = `
      <div class="ai-chat-header">
        <div class="ai-chat-title-group">
          <div class="ai-chat-avatar">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#00d4ff" stroke-width="2">
              <path d="M12 2a4 4 0 0 1 4 4v1a3 3 0 0 1 3 3v4a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5v-4a3 3 0 0 1 3-3V6a4 4 0 0 1 4-4z"/>
              <circle cx="9" cy="12" r="1.5" fill="#00d4ff"/>
              <circle cx="15" cy="12" r="1.5" fill="#00d4ff"/>
            </svg>
          </div>
          <div>
            <div class="ai-chat-title">Pyrolysis AI Copilot</div>
            <div class="ai-chat-status">
              <span class="status-dot offline"></span>
              <span id="ai-status-text">Offline Knowledge · Click ⚙️ to Connect</span>
            </div>
          </div>
        </div>
        <div class="ai-chat-actions">
          <button id="ai-settings-toggle" class="ai-btn-icon" title="Connect Google Gemini API Key" aria-label="Settings">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          <button id="ai-tts-toggle" class="ai-btn-icon" title="Toggle Audio Narration" aria-label="Toggle Audio Narration">
            <svg id="tts-icon-muted" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <line x1="23" y1="9" x2="17" y2="15"/>
              <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
            <svg id="tts-icon-active" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00d4ff" stroke-width="2" style="display:none;">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          </button>
          <button id="ai-chat-clear" class="ai-btn-icon" title="Clear conversation" aria-label="Clear chat">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <button id="ai-chat-close" class="ai-btn-icon" title="Close Copilot (Esc)" aria-label="Close Copilot">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Settings Panel Dropdown -->
      <div class="ai-settings-panel" id="ai-settings-panel" style="display:none;">
        <div class="ai-settings-header">
          <div class="ai-settings-title">⚙️ Connect Google Gemini AI</div>
          <button id="ai-settings-close-btn" class="ai-btn-icon" title="Close Settings">&times;</button>
        </div>
        <div class="ai-settings-body">
          <p class="ai-settings-desc">
            Connect your Google Gemini API key to activate live reasoning, natural conversational answers, and deep pyrolysis modeling.
          </p>
          <div class="ai-settings-field">
            <label for="ai-gemini-key-input">Gemini API Key:</label>
            <input type="password" id="ai-gemini-key-input" placeholder="AIzaSy..." spellcheck="false" autocomplete="off" />
          </div>
          <div class="ai-settings-actions">
            <button id="ai-key-save-btn" class="ai-action-btn primary">Save & Connect</button>
            <button id="ai-key-clear-btn" class="ai-action-btn secondary">Remove Key</button>
          </div>
          <div id="ai-key-feedback" class="ai-key-feedback"></div>
          <div class="ai-settings-help">
            <span>Free API Key: </span>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Get a free key from Google AI Studio &rarr;</a>
          </div>
        </div>
      </div>

      <div class="ai-suggested-prompts-container" id="ai-suggested-prompts">
        <div class="prompt-chip" data-query="How does closed-loop pyrolysis work?">🔄 What is closed loop?</div>
        <div class="prompt-chip" data-query="Where does the 800°C heat carrier come from?">🔥 800°C Heat Carrier</div>
        <div class="prompt-chip" data-query="Why recycle the syngas and what is HDO?">💨 Syngas Recirculation</div>
        <div class="prompt-chip" data-query="What is biochar catalytic cracking?">🧪 Catalytic Biochar</div>
        <div class="prompt-chip" data-query="What products are made and what are they used for?">🛢️ Bio-oil Products</div>
        <div class="prompt-chip" data-query="How does the system achieve zero waste?">🌱 Zero-Waste & LCA</div>
      </div>

      <div class="ai-chat-messages" id="ai-chat-messages"></div>

      <div class="ai-chat-input-bar">
        <textarea id="ai-user-input" placeholder="Ask anything about the process, equipment, or chemistry..." rows="1"></textarea>
        <button id="ai-send-btn" class="ai-send-button" aria-label="Send message">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
      <div class="ai-chat-footer-note">
        Powered by Ezekiyas Tsegaye (2026) Theoretical Framework · Gemini AI Copilot
      </div>
    `;
    document.body.appendChild(drawer);
    this.drawerEl = drawer;
    this.messagesContainer = drawer.querySelector('#ai-chat-messages');
    this.inputEl = drawer.querySelector('#ai-user-input');
    this.sendBtn = drawer.querySelector('#ai-send-btn');
    this.ttsBtn = drawer.querySelector('#ai-tts-toggle');
    this.ttsMutedIcon = drawer.querySelector('#tts-icon-muted');
    this.ttsActiveIcon = drawer.querySelector('#tts-icon-active');

    // Settings Panel elements
    this.settingsPanel = drawer.querySelector('#ai-settings-panel');
    this.settingsToggleBtn = drawer.querySelector('#ai-settings-toggle');
    this.settingsCloseBtn = drawer.querySelector('#ai-settings-close-btn');
    this.keyInput = drawer.querySelector('#ai-gemini-key-input');
    this.saveKeyBtn = drawer.querySelector('#ai-key-save-btn');
    this.clearKeyBtn = drawer.querySelector('#ai-key-clear-btn');
    this.keyFeedback = drawer.querySelector('#ai-key-feedback');
  }

  bindEvents() {
    // Open/Close trigger
    this.launcherEl.addEventListener('click', () => this.toggle());
    this.drawerEl.querySelector('#ai-chat-close').addEventListener('click', () => this.close());
    this.drawerEl.querySelector('#ai-chat-clear').addEventListener('click', () => this.clearChat());

    // Settings panel triggers
    this.settingsToggleBtn.addEventListener('click', () => this.toggleSettings());
    this.settingsCloseBtn.addEventListener('click', () => this.closeSettings());
    this.saveKeyBtn.addEventListener('click', () => this.handleSaveApiKey());
    this.clearKeyBtn.addEventListener('click', () => this.handleClearApiKey());

    // Send on button click
    this.sendBtn.addEventListener('click', () => this.handleUserSubmit());

    // Enter to submit (Shift+Enter for newline)
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleUserSubmit();
      }
    });

    // Auto-grow textarea
    this.inputEl.addEventListener('input', () => {
      this.inputEl.style.height = 'auto';
      this.inputEl.style.height = `${Math.min(this.inputEl.scrollHeight, 100)}px`;
    });

    // Prompt Chips click
    const chips = this.drawerEl.querySelectorAll('.prompt-chip');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-query');
        if (query) {
          this.inputEl.value = query;
          this.handleUserSubmit();
        }
      });
    });

    // Audio Narration Toggle
    this.ttsBtn.addEventListener('click', () => this.toggleTTS());

    // Keyboard shortcut: 'C' to toggle chat
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'c' && !['input', 'textarea'].includes(e.target.tagName.toLowerCase())) {
        e.preventDefault();
        this.toggle();
      }
      if (e.key === 'Escape' && this.isOpen) {
        if (this.settingsPanel && this.settingsPanel.style.display !== 'none') {
          this.closeSettings();
        } else {
          this.close();
        }
      }
    });
  }

  toggleSettings() {
    const isVisible = this.settingsPanel.style.display !== 'none';
    if (isVisible) {
      this.closeSettings();
    } else {
      this.openSettings();
    }
  }

  openSettings() {
    this.settingsPanel.style.display = 'block';
    const stored = this.getStoredApiKey();
    if (stored) {
      this.keyInput.value = stored;
      this.keyFeedback.textContent = '✓ Active Gemini API Key configured in your browser.';
      this.keyFeedback.className = 'ai-key-feedback success';
    } else {
      this.keyInput.value = '';
      this.keyFeedback.textContent = 'No personal key saved. Currently using offline knowledge engine.';
      this.keyFeedback.className = 'ai-key-feedback';
    }
  }

  closeSettings() {
    this.settingsPanel.style.display = 'none';
  }

  async handleSaveApiKey() {
    const key = this.keyInput.value.trim();
    if (!key) {
      this.keyFeedback.textContent = 'Please enter a valid Gemini API key.';
      this.keyFeedback.className = 'ai-key-feedback error';
      return;
    }

    this.keyFeedback.textContent = 'Validating key with Gemini API...';
    this.keyFeedback.className = 'ai-key-feedback';

    // Validate key
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Hello, confirm connection.' }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
      });

      if (res.ok) {
        this.setStoredApiKey(key);
        this.updateStatusBadge(true, 'Gemini 1.5 Flash Connected');
        this.keyFeedback.textContent = '✓ Successfully connected to Google Gemini!';
        this.keyFeedback.className = 'ai-key-feedback success';
        setTimeout(() => this.closeSettings(), 1200);
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || `HTTP ${res.status}`);
      }
    } catch (err) {
      this.keyFeedback.textContent = `Connection failed: ${err.message}`;
      this.keyFeedback.className = 'ai-key-feedback error';
    }
  }

  handleClearApiKey() {
    this.setStoredApiKey('');
    this.keyInput.value = '';
    this.updateStatusBadge(false, 'Offline Knowledge · Click ⚙️ to Connect');
    this.keyFeedback.textContent = 'Key removed. Copilot reverted to offline knowledge mode.';
    this.keyFeedback.className = 'ai-key-feedback';
  }

  async callGeminiDirect(apiKey, messages, telemetry) {
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    let instructionText = SYSTEM_PROMPT;
    if (telemetry) {
      const t = telemetry;
      instructionText += `\n\n[LIVE PLANT TELEMETRY SNAPSHOT FROM 3D DIGITAL TWIN]\n` +
        `- Reactor Operating Temp: ${t.tempC != null ? t.tempC.toFixed(1) : '502.5'} °C (Setpoint: ${t.targetTempC != null ? t.targetTempC.toFixed(1) : '500.0'} °C)\n` +
        `- Ash Combustor Temp: ${t.combustorTempC != null ? t.combustorTempC.toFixed(0) : '800'} °C\n` +
        `- Biomass Feed Rate: ${t.feedRateKgHr != null ? t.feedRateKgHr.toFixed(0) : '1000'} kg/h\n` +
        `- Ash Heat Carrier Circulation: ${t.ashCarrierRateKgHr != null ? t.ashCarrierRateKgHr.toFixed(0) : '5940'} kg/h\n` +
        `- Autothermal Energy Margin: ${t.autothermalMarginMJ > 0 ? '+' : ''}${t.autothermalMarginMJ != null ? t.autothermalMarginMJ.toFixed(1) : '4390.2'} MJ/h (Self-Sustaining: ${t.isAutothermal ? 'YES' : 'NO'})\n` +
        `- Auxiliary Startup Fuel: ${t.trimFuelPct != null ? t.trimFuelPct.toFixed(1) : '0.0'}%\n` +
        `- System Thermal Efficiency: ${t.thermalEfficiency != null ? t.thermalEfficiency.toFixed(1) : '73.6'}%\n` +
        `- Product Yields: Bio-oil ${t.bioOilYieldPct != null ? t.bioOilYieldPct.toFixed(1) : '65.2'}%, Biochar ${t.charYieldPct != null ? t.charYieldPct.toFixed(1) : '17.8'}%, Syngas ${t.gasYieldPct != null ? t.gasYieldPct.toFixed(1) : '17.0'}%\n` +
        `- Syngas Recirculation Ratio: ${t.syngasRecircRatio != null ? t.syngasRecircRatio.toFixed(2) : '0.50'} (HDO Active: ${t.syngasRecirc ? 'YES' : 'NO'})\n` +
        `- In-Situ Char Catalytic Cracking: ${t.charCatalysis ? 'ACTIVE (AAEMs engaged)' : 'OFF'}\n` +
        `You have real-time visibility into these live operational readings. Refer to them naturally when the user asks about the current state, stability, yields, or temperatures!`;
    }

    const payload = {
      system_instruction: {
        parts: [{ text: instructionText }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1024
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini API error ${res.status}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.drawerEl.classList.add('open');
    this.launcherEl.classList.add('hidden');
    setTimeout(() => this.inputEl.focus(), 250);
  }

  close() {
    this.isOpen = false;
    this.drawerEl.classList.remove('open');
    this.launcherEl.classList.remove('hidden');
    if (this.synth) this.synth.cancel();
  }

  clearChat() {
    this.messages = [];
    this.messagesContainer.innerHTML = '';
    if (this.synth) this.synth.cancel();
    this.showWelcomeMessage();
  }

  toggleTTS() {
    this.isTTSActive = !this.isTTSActive;
    if (this.isTTSActive) {
      this.ttsMutedIcon.style.display = 'none';
      this.ttsActiveIcon.style.display = 'block';
      this.ttsBtn.classList.add('active');
      this.speakText('Audio narration activated. I will read explanations aloud for you.');
    } else {
      this.ttsMutedIcon.style.display = 'block';
      this.ttsActiveIcon.style.display = 'none';
      this.ttsBtn.classList.remove('active');
      if (this.synth) this.synth.cancel();
    }
  }

  speakText(text) {
    if (!this.synth || !this.isTTSActive) return;
    this.synth.cancel();

    // Clean markdown and technical formulas for smooth speech
    const cleanSpeech = text
      .replace(/<details>[\s\S]*?<\/details>/gi, '')
      .replace(/\[inspect:[a-zA-Z0-9_-]+\]/gi, '')
      .replace(/[*_#`~[\]()$]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanSpeech) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    this.synth.speak(utterance);
  }

  showWelcomeMessage() {
    const welcomeHtml = `
      <p>Hello! I am your <strong>Closed-Loop Pyrolysis AI Copilot</strong>.</p>
      <p>I can help answer any questions you have about the plant, chemical cracking reactions, energy balances, or thermodynamics. You can ask me questions naturally, or ask me to show and inspect any part of the 3D plant for you!</p>
    `;
    this.appendMessage('assistant', welcomeHtml, null);
  }

  async handleUserSubmit() {
    const text = this.inputEl.value.trim();
    if (!text) return;

    this.inputEl.value = '';
    this.inputEl.style.height = 'auto';

    // Append user message
    this.appendMessage('user', this.escapeHtml(text));
    this.messages.push({ role: 'user', content: text });

    // Show typing loader
    const typingIndicator = this.showTypingIndicator();

    try {
      let responseText = null;
      let usedFallback = false;
      const userKey = this.getStoredApiKey();
      const telemetry = this.sim ? this.sim.lastState : null;

      // 1. If user provided a direct Gemini API Key, use it directly
      if (userKey) {
        try {
          responseText = await this.callGeminiDirect(userKey, this.messages, telemetry);
        } catch (apiErr) {
          console.warn('Direct Gemini call failed:', apiErr);
          usedFallback = true;
        }
      }

      // 2. If no direct response yet, attempt /api/chat endpoint (Vercel or local server)
      if (!responseText) {
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: this.messages,
              apiKey: userKey || undefined,
              telemetry: telemetry || undefined
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data && !data.fallback && data.reply) {
              responseText = data.reply;
            } else {
              usedFallback = true;
            }
          } else {
            usedFallback = true;
          }
        } catch (networkErr) {
          usedFallback = true;
        }
      }

      // 3. Fallback to our built-in offline Pyrolysis Knowledge Engine
      let equipmentId = null;
      if (usedFallback || !responseText) {
        const localMatch = this.queryLocalKnowledge(text);
        responseText = localMatch.html;
        equipmentId = localMatch.equipment;

        // Add subtle connection invitation if not connected
        if (!this.isLLMConnected) {
          responseText += `
            <div class="ai-offline-hint">
              <span>⚡ Answered via built-in knowledge base. </span>
              <button class="ai-hint-link" id="btn-hint-connect">Connect free Gemini API key &rarr;</button>
            </div>
          `;
        }
      }

      // Remove typing indicator
      typingIndicator.remove();

      // Format response and inject 3D inspect tags
      const formatted = this.formatAssistantResponse(responseText, equipmentId);
      this.appendMessage('assistant', formatted.html, formatted.targetEquipment);
      this.messages.push({ role: 'assistant', content: responseText });

      // Trigger audio narration if active
      if (this.isTTSActive) {
        this.speakText(responseText);
      }
    } catch (err) {
      typingIndicator.remove();
      this.appendMessage('assistant', '<p>Sorry, an unexpected error occurred while processing your question.</p>', null);
    }
  }

  queryLocalKnowledge(userQuery) {
    const q = userQuery.toLowerCase();

    // Check for specific equipment queries first
    if (q.includes('combustor') || q.includes('800') || q.includes('heat carrier') || q.includes('ash')) {
      const item = PYROLYSIS_KNOWLEDGE.find((k) => k.id === 'autothermal_heat_carrier');
      return { html: this.renderKnowledgeItem(item), equipment: item.equipment };
    }
    if (q.includes('syngas') || q.includes('hdo') || q.includes('gas') || q.includes('hydrogen') || q.includes('recirculation')) {
      const item = PYROLYSIS_KNOWLEDGE.find((k) => k.id === 'syngas_hdo');
      return { html: this.renderKnowledgeItem(item), equipment: item.equipment };
    }
    if (q.includes('char') || q.includes('catalyst') || q.includes('cracking') || q.includes('tar') || q.includes('aaem')) {
      const item = PYROLYSIS_KNOWLEDGE.find((k) => k.id === 'catalytic_char');
      return { html: this.renderKnowledgeItem(item), equipment: item.equipment };
    }
    if (q.includes('feeder') || q.includes('screw') || q.includes('biomass') || q.includes('wood') || q.includes('raw material')) {
      const item = PYROLYSIS_KNOWLEDGE.find((k) => k.id === 'feedstock_injection');
      return { html: this.renderKnowledgeItem(item), equipment: item.equipment };
    }
    if (q.includes('product') || q.includes('oil') || q.includes('yield') || q.includes('output') || q.includes('bio-oil')) {
      const item = PYROLYSIS_KNOWLEDGE.find((k) => k.id === 'bio_oil_products');
      return { html: this.renderKnowledgeItem(item), equipment: item.equipment };
    }
    if (q.includes('zero waste') || q.includes('waste') || q.includes('environment') || q.includes('green') || q.includes('carbon')) {
      const item = PYROLYSIS_KNOWLEDGE.find((k) => k.id === 'environmental_benefits');
      return { html: this.renderKnowledgeItem(item), equipment: item.equipment };
    }

    // Keyword match scoring
    let bestScore = 0;
    let bestItem = PYROLYSIS_KNOWLEDGE[0];

    for (const item of PYROLYSIS_KNOWLEDGE) {
      let score = 0;
      for (const kw of item.keywords) {
        if (q.includes(kw)) score += kw.length;
      }
      if (score > bestScore) {
        bestScore = score;
        bestItem = item;
      }
    }

    return { html: this.renderKnowledgeItem(bestItem), equipment: bestItem.equipment };
  }

  renderKnowledgeItem(item) {
    let combinedMd = item.summary;
    if (item.technical) {
      combinedMd += `\n\n${item.technical}`;
    }
    let out = this.markdownToHtml(combinedMd);
    if (item.equipment) {
      out += `
        <div class="ai-equipment-action">
          <button class="ai-inspect-btn" data-unit="${item.equipment}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Inspect ${item.equipmentName} in 3D
          </button>
        </div>
      `;
    }
    return out;
  }

  formatAssistantResponse(rawText, presetEquipment) {
    let html = rawText;
    let targetEquipment = presetEquipment;

    // Detect and replace [inspect:unit] tokens
    const inspectRegex = /\[inspect:([a-zA-Z0-9_-]+)\]/gi;
    html = html.replace(inspectRegex, (match, unitId) => {
      targetEquipment = unitId.toLowerCase();
      const unitNames = {
        reactor: 'Fast Pyrolysis Reactor',
        combustor: '800 °C Solid Ash Combustor',
        feeder: 'Biomass Feeder',
        separation: 'Primary Cyclone & Char Bed',
        condenser: 'Fractional Condenser'
      };
      const label = unitNames[targetEquipment] || targetEquipment.toUpperCase();
      return `
        <div class="ai-equipment-action">
          <button class="ai-inspect-btn" data-unit="${targetEquipment}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Inspect ${label} in 3D
          </button>
        </div>
      `;
    });

    // Parse simple markdown if not already formatted
    if (!html.includes('<p>') && !html.includes('<ul>')) {
      html = this.markdownToHtml(html);
    }

    return { html, targetEquipment };
  }

  markdownToHtml(md) {
    if (!md) return '';
    let out = md;

    // Headings
    out = out.replace(/^### (.*$)/gim, '<h4 class="ai-md-h4">$1</h4>');
    out = out.replace(/^## (.*$)/gim, '<h3 class="ai-md-h3">$1</h3>');

    // Code formatting: inline code `code`
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold & italic
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Bullet lists
    out = out.replace(/^\s*-\s+(.*)$/gim, '<li>$1</li>');
    out = out.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');
    out = out.replace(/<\/ul>\s*<ul>/g, '');

    // Paragraphs
    const paras = out.split(/\n\n+/);
    out = paras.map((p) => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<ul>') || p.startsWith('<div') || p.startsWith('<details') || p.startsWith('<pre')) return p;
      return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('');

    return out;
  }

  showTypingIndicator() {
    const el = document.createElement('div');
    el.className = 'ai-msg-bubble ai-msg-assistant typing';
    el.innerHTML = `
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
      <span class="typing-label">Consulting process dynamics...</span>
    `;
    this.messagesContainer.appendChild(el);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    return el;
  }

  appendMessage(role, htmlContent, targetUnit) {
    const bubble = document.createElement('div');
    bubble.className = `ai-msg-bubble ai-msg-${role}`;
    bubble.innerHTML = htmlContent;

    // Bind inspect button clicks
    const inspectBtns = bubble.querySelectorAll('.ai-inspect-btn');
    inspectBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const unit = btn.getAttribute('data-unit');
        if (unit && this.controls && this.controls.setPreset) {
          this.controls.setPreset(unit);
          btn.classList.add('focused');
          setTimeout(() => btn.classList.remove('focused'), 2000);
        }
      });
    });

    // Bind hint connect button click
    const hintConnectBtn = bubble.querySelector('#btn-hint-connect');
    if (hintConnectBtn) {
      hintConnectBtn.addEventListener('click', () => this.openSettings());
    }

    this.messagesContainer.appendChild(bubble);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

    // Auto-glide camera if explicitly linked to a single equipment
    if (role === 'assistant' && targetUnit && this.controls && this.controls.setPreset) {
      if (this.controls.viewPresets && this.controls.viewPresets[targetUnit]) {
        this.controls.setPreset(targetUnit);
      }
    }
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

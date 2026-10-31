/**
 * Vercel Serverless Function: /api/chat
 * Provides AI conversational intelligence for the Closed-Loop Pyrolysis 3D Digital Twin.
 * Powered by Google Gemini API with system guidance based on:
 * "Integrated Theoretical Framework for Byproduct Reintegration in Closed-Loop Pyrolysis Systems"
 * (Ezekiyas Tsegaye, 2026)
 */

const SYSTEM_PROMPT = `
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

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = req.body?.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Graceful fallback trigger: Tells client to use high-fidelity offline knowledge engine
    return res.status(200).json({
      fallback: true,
      message: 'GEMINI_API_KEY not configured. Falling back to built-in offline Pyrolysis Knowledge Engine.'
    });
  }

  try {
    const { messages } = req.body || {};
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Missing messages array in request body.' });
    }

    // Convert messages to Gemini contents structure
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // Build system instruction, including live telemetry snapshot if provided
    let instructionText = SYSTEM_PROMPT;
    if (req.body?.telemetry) {
      const t = req.body.telemetry;
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

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', response.status, errText);
      return res.status(200).json({
        fallback: true,
        error: `Gemini API returned ${response.status}`,
        message: 'Switching to built-in offline Pyrolysis Knowledge Engine.'
      });
    }

    const data = await response.json();
    const replyText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'I was unable to generate an explanation at this moment. Please try again.';

    return res.status(200).json({
      reply: replyText,
      fallback: false
    });
  } catch (err) {
    console.error('Chat endpoint error:', err);
    return res.status(200).json({
      fallback: true,
      error: err.message,
      message: 'Network issue. Falling back to built-in offline Pyrolysis Knowledge Engine.'
    });
  }
}

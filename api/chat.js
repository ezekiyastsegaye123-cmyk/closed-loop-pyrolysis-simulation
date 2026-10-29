/**
 * Vercel Serverless Function: /api/chat
 * Provides AI conversational intelligence for the Closed-Loop Pyrolysis 3D Digital Twin.
 * Powered by Google Gemini API with system guidance based on:
 * "Integrated Theoretical Framework for Byproduct Reintegration in Closed-Loop Pyrolysis Systems"
 * (Ezekiyas Tsegaye, 2026)
 */

const SYSTEM_PROMPT = `
You are the AI Process Copilot for the Closed-Loop Pyrolysis 3D Digital Twin, based on the engineering framework by Ezekiyas Tsegaye (2026).
Your job is to explain the closed-loop pyrolysis process to consumers, students, and engineers with clarity, scientific precision, and engaging analogies.

Key System Principles:
1. Closed-Loop Pyrolysis: Fast pyrolysis without external fossil fuel during steady-state.
2. Autothermal Balance: Recirculating 800 °C solid ash/char heat carrier (5,940 kg per 1,000 kg dry feed) supplies all endothermic heat, yielding +4,390 MJ/h energy surplus.
3. Auxiliary Start-Up Fuel: Only used during initial thermal ramp-up, then modulated down to 0%.
4. Recirculated Syngas HDO: Non-condensable syngas (H2, CO, CH4, CO2) recirculated at a 0.4 - 0.6 ratio into the reactor creates an in-situ hydrodeoxygenation (HDO) atmosphere, stabilizing bio-oil and lowering acid number.
5. In-Situ Char Catalytic Cracking: AAEMs (alkali and alkaline earth metals: K, Ca, Mg) in the biochar bed catalyze secondary cracking of heavy tar volatiles into light condensables and syngas.
6. Product Yields: Upgraded Bio-oil (~65 wt%), Biochar (~18 wt%), Non-condensable Syngas (~17 wt%).
7. Reactor Nominal Conditions: 500 °C operating temperature (allowable 450 - 550 °C), atmospheric pressure (~1.05 bar).

Format Your Responses:
1. Plain-English Summary: Start with an intuitive, consumer-friendly explanation with everyday analogies.
2. 3D Navigation Tags: Whenever discussing a major equipment, embed an action tag that the 3D viewer recognizes:
   - [inspect:reactor] - Fast Pyrolysis Fluidized Bed Reactor
   - [inspect:combustor] - 800 °C Solid Ash Combustor & Reheater
   - [inspect:feeder] - Twin Screw Biomass Feeder
   - [inspect:separation] - Primary Cyclone & Catalytic Char Bed
   - [inspect:condenser] - Fractional Condensation Train
3. Deep Dive / Engineering Details: At the bottom of your answer, include an expandable markdown section:
   <details>
   <summary>Technical & Kinetic Details</summary>
   (Include quantitative formulas, Semyonov kinetics, AAEM catalytic mechanisms, mass/energy balance values from the framework).
   </details>
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

  const apiKey = process.env.GEMINI_API_KEY;
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

    const payload = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }]
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

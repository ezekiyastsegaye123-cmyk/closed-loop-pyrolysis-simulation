import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PYROLYSIS_KNOWLEDGE, AIChatCopilot } from '../js/chat.js';

describe('Pyrolysis Knowledge Base & Copilot Logic QA Suite', () => {
  test('Knowledge Base contains required core topics with complete schemas', () => {
    assert.ok(Array.isArray(PYROLYSIS_KNOWLEDGE));
    assert.ok(PYROLYSIS_KNOWLEDGE.length >= 7);

    const requiredFields = ['id', 'title', 'keywords', 'summary', 'technical', 'equipment'];
    for (const item of PYROLYSIS_KNOWLEDGE) {
      for (const field of requiredFields) {
        assert.ok(item[field], `Item ${item.id} missing required field '${field}'`);
      }
      assert.ok(item.keywords.length > 0, `Item ${item.id} has empty keywords`);
      assert.ok(item.summary.length > 50, `Item ${item.id} summary is too short`);
    }
  });

  test('AIChatCopilot instance can be created in headless environment', () => {
    const copilot = new AIChatCopilot(null, null, null);
    assert.ok(copilot);
    assert.strictEqual(typeof copilot.queryLocalKnowledge, 'function');
    assert.strictEqual(typeof copilot.formatAssistantResponse, 'function');
    assert.strictEqual(typeof copilot.markdownToHtml, 'function');
  });

  test('Query matching routes to correct knowledge topic and 3D equipment preset', () => {
    const copilot = new AIChatCopilot(null, null, null);

    // 1. Combustor / Heat Carrier query
    const resComb = copilot.queryLocalKnowledge('Where does the 800°C solid ash heat carrier come from?');
    assert.strictEqual(resComb.equipment, 'combustor');
    assert.ok(resComb.html.includes('800'));

    // 2. Syngas HDO query
    const resSyngas = copilot.queryLocalKnowledge('What is syngas hydrodeoxygenation and recirculation ratio?');
    assert.strictEqual(resSyngas.equipment, 'condenser');
    assert.ok(resSyngas.html.includes('Syngas') || resSyngas.html.includes('HDO'));

    // 3. Catalytic char query
    const resChar = copilot.queryLocalKnowledge('How does the active biochar crack secondary tars?');
    assert.strictEqual(resChar.equipment, 'separation');
    assert.ok(resChar.html.includes('AAEM') || resChar.html.includes('catalyst') || resChar.html.includes('cracking'));

    // 4. Feeder query
    const resFeeder = copilot.queryLocalKnowledge('How does the biomass injection screw work?');
    assert.strictEqual(resFeeder.equipment, 'feeder');
    assert.ok(resFeeder.html.includes('Feeder') || resFeeder.html.includes('screw'));

    // 5. Products query
    const resProd = copilot.queryLocalKnowledge('What products and yields are produced from 1000 kg feed?');
    assert.ok(resProd.html.includes('Bio-Oil') || resProd.html.includes('Biochar'));

    // 6. Zero waste query
    const resWaste = copilot.queryLocalKnowledge('Is this system zero waste and circular?');
    assert.ok(resWaste.html.includes('zero-waste') || resWaste.html.includes('carbon'));
  });

  test('FormatAssistantResponse transforms [inspect:unit] tokens into 3D navigation actions', () => {
    const copilot = new AIChatCopilot(null, null, null);
    const raw = 'The biomass enters the [inspect:feeder] and gets heated inside the [inspect:reactor].';
    const formatted = copilot.formatAssistantResponse(raw, null);

    assert.ok(formatted.html.includes('ai-inspect-btn'));
    assert.ok(formatted.html.includes('data-unit="feeder"'));
    assert.ok(formatted.html.includes('data-unit="reactor"'));
  });

  test('Markdown parser converts bold, lists, and paragraphs cleanly', () => {
    const copilot = new AIChatCopilot(null, null, null);
    const md = `**Autothermal Loop**\n\n- Zero fossil fuel\n- Surplus energy`;
    const html = copilot.markdownToHtml(md);

    assert.ok(html.includes('<strong>Autothermal Loop</strong>'));
    assert.ok(html.includes('<li>Zero fossil fuel</li>'));
    assert.ok(html.includes('<ul>'));
  });
});

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/chat.js';

describe('Vercel Serverless Function /api/chat QA Suite', () => {
  test('Handler is a valid function', () => {
    assert.strictEqual(typeof handler, 'function');
  });

  test('OPTIONS request returns 200 and sets CORS headers', async () => {
    let statusCode = null;
    const headers = {};
    const req = { method: 'OPTIONS' };
    const res = {
      setHeader: (k, v) => { headers[k] = v; },
      status: (code) => {
        statusCode = code;
        return { end: () => {} };
      }
    };

    await handler(req, res);
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(headers['Access-Control-Allow-Origin'], '*');
    assert.ok(headers['Access-Control-Allow-Methods'].includes('POST'));
  });

  test('GET request returns 405 Method Not Allowed', async () => {
    let statusCode = null;
    let jsonBody = null;
    const req = { method: 'GET' };
    const res = {
      setHeader: () => {},
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => { jsonBody = data; }
        };
      }
    };

    await handler(req, res);
    assert.strictEqual(statusCode, 405);
    assert.ok(jsonBody.error.includes('Method not allowed'));
  });

  test('POST with empty body returns 400 Bad Request', async () => {
    const origKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test_key';

    let statusCode = null;
    let jsonBody = null;
    const req = { method: 'POST', body: {} };
    const res = {
      setHeader: () => {},
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => { jsonBody = data; }
        };
      }
    };

    try {
      await handler(req, res);
      assert.strictEqual(statusCode, 400);
      assert.ok(jsonBody.error.includes('Missing messages array'));
    } finally {
      if (origKey === undefined) {
        delete process.env.GEMINI_API_KEY;
      } else {
        process.env.GEMINI_API_KEY = origKey;
      }
    }
  });

  test('POST without GEMINI_API_KEY triggers graceful fallback with status 200', async () => {
    const origKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    let statusCode = null;
    let jsonBody = null;
    const req = {
      method: 'POST',
      body: { messages: [{ role: 'user', content: 'What is closed-loop pyrolysis?' }] }
    };
    const res = {
      setHeader: () => {},
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => { jsonBody = data; }
        };
      }
    };

    try {
      await handler(req, res);
      assert.strictEqual(statusCode, 200);
      assert.strictEqual(jsonBody.fallback, true);
      assert.ok(jsonBody.message.includes('GEMINI_API_KEY not configured'));
    } finally {
      if (origKey !== undefined) {
        process.env.GEMINI_API_KEY = origKey;
      }
    }
  });
});

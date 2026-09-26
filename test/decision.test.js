'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { decide } = require('../server/decision');
const plugin = require('../server');

const options = { ...plugin.config.default, minConfidence: 0.8 };

test('approves a sufficiently confident Jev decision and keeps content out of the result', async () => {
  process.env.JEV_API_KEY = 'test-key';
  let request;
  const result = await decide('Sample draft', options, async (_url, init) => {
    request = JSON.parse(init.body);
    return { ok: true, headers: { get: () => null }, text: async () => JSON.stringify({ answers: {
      editorial: { type: 'choice', choice: 'approve', confidence: 0.91, probabilities: { approve: 0.91, escalate: 0.07, revise: 0.02 } },
    } }) };
  });
  assert.equal(request.questions.editorial.type, 'choice');
  assert.equal(result.action, 'approve');
  assert.equal(result.stateHash.length, 64);
  assert.equal(JSON.stringify(result).includes('Sample draft'), false);
});

test('routes uncertain or invalid answers to review or failure', async () => {
  process.env.JEV_API_KEY = 'test-key';
  const transport = async () => ({ ok: true, headers: { get: () => null }, text: async () => JSON.stringify({ answers: {
    editorial: { type: 'choice', choice: 'approve', confidence: 0.55 },
  } }) });
  assert.equal((await decide('Draft', options, transport)).action, 'review');
  await assert.rejects(decide('Draft', options, async () => ({ ok: true, headers: { get: () => null }, text: async () => '{}' })), /unavailable/);
});

test('publish guard blocks uncertain content before the publish action', async () => {
  process.env.JEV_API_KEY = 'test-key';
  let middleware;
  const strapi = {
    config: { get: () => ({ ...options, guardPublishing: true, contentTypes: { 'api::article.article': { field: 'body' } } }) },
    documents: Object.assign(() => ({ findOne: async () => ({ body: 'Draft' }) }), { use: (fn) => { middleware = fn; } }),
  };
  plugin.register({ strapi });
  const original = global.fetch;
  global.fetch = async () => ({ ok: true, headers: { get: () => null }, text: async () => JSON.stringify({ answers: {
    editorial: { type: 'choice', choice: 'escalate', confidence: 0.98 },
  } }) });
  try {
    let published = false;
    await assert.rejects(middleware({ uid: 'api::article.article', action: 'publish', params: { documentId: 'x' } }, () => { published = true; }), /review/);
    assert.equal(published, false);
  } finally { global.fetch = original; }
});

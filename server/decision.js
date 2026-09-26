'use strict';

const { createHash } = require('node:crypto');
const message = require('./messages');

function validate(options) {
  const locale = options.locale || 'en';
  if (!['en', 'fr', 'es'].includes(locale) || !options.model ||
      !Number.isInteger(options.timeoutMs) || options.timeoutMs < 100 || options.timeoutMs > 120000 ||
      !Number.isInteger(options.maxChars) || options.maxChars < 1 || options.maxChars > 100000 ||
      !Number.isFinite(options.minConfidence) || options.minConfidence < 0 || options.minConfidence > 1 ||
      !options.criteria || Object.keys(options.criteria).sort().join(',') !== 'approve,escalate,revise') {
    throw new Error(message(locale, 'config'));
  }
  for (const value of Object.values(options.criteria)) {
    if (typeof value !== 'string' || value.length < 1 || value.length > 4000) throw new Error(message(locale, 'config'));
  }
  return locale;
}

function endpointFrom(options) {
  const value = options.endpoint || 'https://api.typesafe.ai/v1/systemone';
  const url = new URL(value);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname))) {
    throw new Error(message(options.locale, 'config'));
  }
  return url;
}

async function decide(text, options, transport = fetch) {
  const locale = validate(options);
  const key = process.env.JEV_API_KEY || process.env.TYPESAFE_API_KEY;
  if (!key) throw new Error(message(locale, 'key'));
  if (typeof text !== 'string' || !text.trim()) throw new Error(message(locale, 'missing'));
  const url = endpointFrom(options);
  const state = text.slice(0, options.maxChars);
  const payload = {
    model: options.model,
    state,
    questions: {
      editorial: {
        type: 'choice',
        instructions: options.instructions,
        criteria: options.criteria,
      },
    },
  };
  let response;
  try {
    response = await transport(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(options.timeoutMs),
    });
    if (!response.ok || Number(response.headers?.get?.('content-length') || 0) > 100000) throw new Error();
    const raw = await response.text();
    if (raw.length > 100000) throw new Error();
    const result = JSON.parse(raw);
    const answer = result.answers?.editorial;
    if (answer?.type !== 'choice' || !Object.hasOwn(options.criteria, answer.choice) ||
        !Number.isFinite(answer.confidence) || answer.confidence < 0 || answer.confidence > 1) throw new Error();
    return {
      choice: answer.choice,
      confidence: answer.confidence,
      probabilities: answer.probabilities,
      model: options.model,
      stateHash: createHash('sha256').update(state).digest('hex'),
      action: answer.confidence >= options.minConfidence && answer.choice === 'approve'
        ? 'approve' : 'review',
    };
  } catch {
    throw new Error(message(locale, 'unavailable'));
  }
}

module.exports = { decide, validate };

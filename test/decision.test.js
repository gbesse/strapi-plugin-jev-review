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
    editorial: { type: 'choice', choice: 'approve', confidence: 0.55, probabilities: { approve:.7, escalate:.2, revise:.1 } },
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
    editorial: { type: 'choice', choice: 'escalate', confidence: 0.98, probabilities: { approve:.01, escalate:.98, revise:.01 } },
  } }) });
  try {
    let published = false;
    await assert.rejects(middleware({ uid: 'api::article.article', action: 'publish', params: { documentId: 'x' } }, () => { published = true; }), /review/);
    assert.equal(published, false);
  } finally { global.fetch = original; }
});

test('oversized drafts fail before transport in each locale instead of approving a prefix',async()=>{
 for(const locale of ['fr','en','es']){let calls=0;await assert.rejects(decide('x'.repeat(options.maxChars+1),{...options,locale},async()=>{calls++;}),error=>!!error.message);assert.equal(calls,0);}
});
test('changed locale-specific draft blocks publication after a confident result',async()=>{
 let middleware,reads=0,published=false;const seen=[];
 const strapi={config:{get:()=>({...options,guardPublishing:true,contentTypes:{article:{field:'body'}}})},documents:Object.assign(()=>({findOne:async params=>{seen.push(params);reads++;return {body:reads===1?'original':'changed'};}}),{use:fn=>middleware=fn})};
 plugin.register({strapi});const original=global.fetch;global.fetch=async()=>({ok:true,headers:{get:()=>null},text:async()=>JSON.stringify({answers:{editorial:{type:'choice',choice:'approve',confidence:.99,probabilities:{approve:.99,escalate:.005,revise:.005}}}})});
 try{await assert.rejects(middleware({uid:'article',action:'publish',params:{documentId:'id',locale:'fr'}},()=>{published=true;}),/changed/);assert.equal(published,false);assert.ok(seen.every(params=>params.locale==='fr'));}finally{global.fetch=original;}
});


test('malformed or contradictory distributions never authorize publication in any locale',async()=>{
 process.env.JEV_API_KEY='synthetic-key';
 const bad=[undefined,{approve:1},{approve:.9,escalate:.9,revise:0},{approve:.9,escalate:-.1,revise:.2},{approve:'0.9',escalate:.1,revise:0},{approve:.1,escalate:.8,revise:.1},{approve:.9,escalate:.1,revise:0,extra:0}];
 for(const locale of ['fr','en','es'])for(const probabilities of bad){
  const transport=async()=>({ok:true,headers:{get:()=>null},text:async()=>JSON.stringify({model:options.model,answers:{editorial:{type:'choice',choice:'approve',confidence:.99,probabilities}}})});
  await assert.rejects(decide('Draft',{...options,locale},transport),error=>Boolean(error.message));
 }
});
test('declared model mismatch rejects and policy mutations cannot relax the suspended decision',async()=>{
 process.env.JEV_API_KEY='synthetic-key';
 const answer={type:'choice',choice:'approve',confidence:.7,probabilities:{approve:.8,escalate:.1,revise:.1}};
 const transport=model=>async()=>({ok:true,headers:{get:()=>null},text:async()=>JSON.stringify({model,answers:{editorial:answer}})});
 await assert.rejects(decide('Draft',options,transport('different-model')),/unavailable/);
 const mutable={...options,criteria:{...options.criteria}};
 const result=await decide('Draft',mutable,async(...args)=>{mutable.minConfidence=.1;mutable.model='changed';mutable.criteria.extra='changed';return transport(options.model)(...args);});
 assert.equal(result.action,'review');assert.equal(result.model,options.model);
});

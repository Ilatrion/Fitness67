import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateWithOpenAI, validEstimate } from '../src/openai.ts';
const item={name:'Яйцо',estimatedGrams:100,per100:{kcal:155,protein:13,fat:11,carbs:1},uncertainty:'Средний размер'};
const reply=(items:unknown)=>new Response(JSON.stringify({output:[{content:[{type:'output_text',text:JSON.stringify({items})}]}]}),{status:200});
test('OpenAI request uses fixed HTTPS endpoint, no storage, separate portions and per100',async()=>{
 let called=false;
 const mock=async(url:any,options:any)=>{called=true;assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(options.headers.Authorization,'Bearer fake-test-only');const body=JSON.parse(options.body);assert.equal(body.store,false);assert.equal(body.input[1].content[0].text,'Два яйца');return reply([item]);};
 assert.deepEqual(await estimateWithOpenAI('fake-test-only',{text:'Два яйца'},mock as typeof fetch),[item]);assert.ok(called);
});
test('Malformed, empty and excessive AI results cannot enter diary',async()=>{
 assert.equal(validEstimate({...item,estimatedGrams:-1}),false);
 assert.equal(validEstimate({...item,per100:{...item.per100,kcal:NaN}}),false);
 for(const items of [[],[{...item,estimatedGrams:0}],Array(13).fill(item)]) await assert.rejects(()=>estimateWithOpenAI('fake',{text:'Еда'},(async()=>reply(items)) as typeof fetch));
});
test('Missing key and invalid text do not make a request',async()=>{
 const mock=(async()=>{throw Error('must not request');}) as typeof fetch;
 await assert.rejects(()=>estimateWithOpenAI('',{text:'Еда'},mock),/ключ/);
 await assert.rejects(()=>estimateWithOpenAI('fake',{text:' '.repeat(3)},mock),/Опишите/);
});
test('Revoked key, quota and network errors have actionable messages without exposing key',async()=>{
 for(const [status,message] of [[401,/отклонил ключ/],[429,/баланс/],[500,/не выполнил/]] as const) await assert.rejects(()=>estimateWithOpenAI('fake-secret',{text:'Еда'},(async()=>new Response('{}',{status})) as typeof fetch),message);
 await assert.rejects(()=>estimateWithOpenAI('fake-secret',{text:'Еда'},(async()=>{throw Error('fake-secret')}) as typeof fetch),e=>e instanceof Error && !e.message.includes('fake-secret'));
});

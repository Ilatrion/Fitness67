import test from 'node:test';import assert from 'node:assert/strict';
// Bundle imports require Metro; test the pure implementation through a temporary JSON-free copy in the runner.
import {fromPerek,fromOff,searchCatalogs,validProduct} from '../src/scannerCatalog.testable.ts';
const code='4606068171360',per100={kcal:120,protein:8,fat:4,carbs:13};
const perek={food:{name:'Каша',unit:'г',barcodes:[code],per100,url:'https://perek.us/food/test'}};
test('Perek is queried independently of OFF with its own header; conflicts stay separate',async()=>{
 const calls:any[]=[];const r=await searchCatalogs(code,{perek:'test-only'},(async(url:any,opts:any)=>{calls.push([url,opts]);if(url.includes('perek.us')){assert.equal(opts.headers['X-Api-Key'],'test-only');return Response.json(perek)}assert.equal(opts.headers['X-Api-Key'],undefined);return Response.json({status:1,product:{code,product_name:'Каша другая',nutriments:{'energy-kcal_100g':125,proteins_100g:8,fat_100g:4,carbohydrates_100g:14}}})}) as typeof fetch);
 assert.equal(calls.length,2);assert.equal(r.foods.length,2);assert.equal(r.foods[0].kcal,120);assert.equal(r.foods[1].kcal,125);assert.ok(!JSON.stringify(r).includes('test-only'));
});
test('unknown grams/millilitres and incomplete nutrition never silently become zeros',()=>{
 assert.equal(fromPerek({food:{...perek.food,unit:'мл'}},code)?.unit,'ml');assert.equal(fromPerek({food:{...perek.food,unit:'порция'}},code),null);
 assert.equal(fromPerek({food:{...perek.food,per100:{...per100,fat:null}}},code),null);
 assert.equal(fromOff({status:1,product:{code,product_name:'x',nutriments:{'energy-kcal_100g':100}}},code),null);
 assert.equal(fromPerek({food:{...perek.food,barcodes:['4606068171361']}},code),null);
});
test('missing Perek key is reported and no request to it is made',async()=>{
 const r=await searchCatalogs(code,{},(async(url:any)=>{assert.ok(!url.includes('perek.us'));return Response.json({status:0})}) as typeof fetch);assert.equal(r.foods.length,0);assert.ok(r.sources.some(x=>x.name==='perek.us'&&x.status==='not_configured'));
});
test('revoked key and quota have distinct states without blocking other source',async()=>{
 for(const [status,label] of [[401,'access_denied'],[429,'rate_limited']] as const){const r=await searchCatalogs(code,{perek:'fake'},(async(url:any)=>url.includes('perek.us')?new Response('{}',{status}):Response.json({status:0})) as typeof fetch);assert.equal(r.sources[0].status,label);}
});

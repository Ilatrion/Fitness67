import test from 'node:test';import assert from 'node:assert/strict';import {alternatives,recentUses} from '../src/productSuggestions.ts';import type {Product} from '../src/scannerCatalog';
const p:Product={id:'p',barcode:'4606068171360',name:'Каша',brand:'',unit:'g',kcal:120,protein:8,fat:4,carbs:13,source:'test',sourceUrl:''};
test('repeat message counts eaten records only in last 7 days, excluding plans and future',()=>{
 const dates=['2026-11-08','2026-11-09','2026-11-14','2026-11-15'];const logs=dates.map(date=>({product:p,date,done:true}));logs.push({product:p,date:'2026-11-14',done:false});assert.equal(recentUses(logs,p,'2026-11-14'),3);
});
test('alternatives respect units, exclude same barcode and compare actual values',()=>{
 const q={...p,id:'q',barcode:'4606068171377',carbs:30};const liquid={...q,id:'l',barcode:'4606068171384',unit:'ml' as const,carbs:99};const results=alternatives(p,[p,q,{...q,id:'duplicate'},liquid],'carbs');assert.equal(results.length,1);assert.equal(results[0].id,'q');assert.equal(alternatives(p,[q],'fat').length,0);
});

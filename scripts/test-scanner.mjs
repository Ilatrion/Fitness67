import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';import {spawnSync} from 'node:child_process';
const path=new URL('../src/scannerCatalog.testable.ts',import.meta.url);let s=readFileSync(new URL('../src/scannerCatalog.ts',import.meta.url),'utf8').replace("import bundled from './scanner-products.json';","const bundled: Product[] = [];");
try{writeFileSync(path,s);const r=spawnSync(process.execPath,['--experimental-strip-types','--test','tests/scannerCatalog.test.ts'],{stdio:'inherit'});process.exitCode=r.status||0;}finally{unlinkSync(path)}

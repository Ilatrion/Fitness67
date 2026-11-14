// Generate local build configuration without logging the key.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
let key=process.env.PEREK_API_KEY;
if(key===undefined&&existsSync('.env')){
 const line=readFileSync('.env','utf8').split(/\r?\n/).find(l=>/^\s*PEREK_API_KEY\s*=/.test(l));
 if(line){key=line.slice(line.indexOf('=')+1).trim();if((key.startsWith('"')&&key.endsWith('"'))||(key.startsWith("'")&&key.endsWith("'")))key=key.slice(1,-1);}
}
key=(key||'').trim();
if(key&&(/\s/.test(key)||key.length<8||key.length>512))throw Error('Некорректный формат PEREK_API_KEY. Значение не выводится.');
writeFileSync('src/catalogBuild.ts',`// Generated locally. Do not commit or distribute this source file.\nexport const configuredPerekKey: string = ${JSON.stringify(key)};\n`);
console.log(key?'perek.us: ключ задан для этой сборки (значение скрыто)':'perek.us: переменная не задана; доступен ввод личного ключа в Android APK');

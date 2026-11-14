import bundled from './scanner-products.json';
export type Product={id:string;barcode:string;name:string;brand:string;unit:'g'|'ml';kcal:number;protein:number;fat:number;carbs:number;source:string;sourceUrl:string;image?:string;providerId?:string;seenAt?:string};
export type SourceStatus={name:string;status:'found'|'not_found'|'unavailable'|'not_configured'|'incomplete'|'rate_limited'|'access_denied'};
export const bundledProducts=bundled as Product[];
export function validCode(code:string){return /^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(code);}
export function canonical(code:string){return code.padStart(14,'0');}
const value=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
export function validProduct(p:any):p is Product{return !!p&&validCode(p.barcode)&&typeof p.id==='string'&&typeof p.name==='string'&&!!p.name.trim()&&p.name.length<=500&&typeof p.source==='string'&&typeof p.sourceUrl==='string'&&['g','ml'].includes(p.unit)&&value(p.kcal)&&p.kcal<=1000&&['protein','fat','carbs'].every(k=>value(p[k])&&p[k]<=100);}
function imageUrl(x:any){try{const u=new URL(x);return u.protocol==='https:'?u.href:undefined;}catch{return undefined;}}
export function fromPerek(body:any,code:string):Product|null{
 const p=body?.food,n=p?.per100;if(!p||!n)return null;
 if(p.barcodes?.length&&!p.barcodes.some((c:any)=>typeof c==='string'&&validCode(c)&&canonical(c)===canonical(code)))return null;
 if(p.unit&&!['г','g','мл','ml'].includes(p.unit))return null;
 const r={id:`perek:${p.id||code}`,barcode:code,name:p.name,brand:typeof p.brand?.name==='string'?p.brand.name:'',unit:p.unit==='мл'||p.unit==='ml'?'ml':'g',...n,source:'perek.us',sourceUrl:typeof p.url==='string'&&p.url.startsWith('https://perek.us/')?p.url:'https://perek.us/',providerId:p.id||undefined} as Product;
 return validProduct(r)?r:null;
}
export function fromOff(body:any,code:string):Product|null{
 const p=body?.product,n=p?.nutriments;if(body?.status!==1||!p||!n)return null;
 if(p.code&&canonical(String(p.code))!==canonical(code))return null;
 const r={id:`off:${code}`,barcode:code,name:p.product_name_ru||p.product_name,brand:p.brands||'',unit:'g' as const,kcal:n['energy-kcal_100g']??(typeof n.energy_100g==='number'?n.energy_100g/4.184:undefined),protein:n.proteins_100g,fat:n.fat_100g,carbs:n.carbohydrates_100g,source:'Open Food Facts · ODbL / DbCL',sourceUrl:`https://world.openfoodfacts.org/product/${code}`,image:imageUrl(p.image_front_small_url||p.image_url)};
 return validProduct(r)?r:null;
}
export async function searchCatalogs(code:string,keys:{perek?:string;usda?:string}={},providerFetch:typeof fetch=fetch):Promise<{foods:Product[];sources:SourceStatus[]}>{
 if(!validCode(code))throw Error('Введите 8, 12, 13 или 14 цифр штрихкода');
 const jobs:[string,string,Record<string,string>,(body:any)=>Product|null][]=[];
 if(keys.perek)jobs.push(['perek.us',`https://perek.us/api/v1/foods/barcode/${code}`,{'X-Api-Key':keys.perek},b=>fromPerek(b,code)]);
 jobs.push(['Open Food Facts',`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=code,product_name,product_name_ru,brands,nutriments,image_front_small_url`,{},b=>fromOff(b,code)]);
 // USDA is an independent public-domain catalogue; personal API access is optional.
 if(keys.usda)jobs.push(['USDA FoodData Central',`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(keys.usda)}&query=${code}&dataType=Branded&pageSize=25`,{},b=>{
 const f=b.foods?.find((x:any)=>typeof x.gtinUpc==='string'&&canonical(x.gtinUpc)===canonical(code));if(!f)return null;
 const n=(id:number)=>f.foodNutrients?.find((x:any)=>x.nutrientId===id)?.value;
 const r={id:`usda:${f.fdcId}`,barcode:code,name:f.description,brand:f.brandName||f.brandOwner||'',unit:'g' as const,kcal:n(1008)??n(2048)??n(2047),protein:n(1003),fat:n(1004),carbs:n(1005),source:'USDA FoodData Central · CC0',sourceUrl:`https://fdc.nal.usda.gov/food-details/${f.fdcId}/nutrients`};return validProduct(r)?r:null;
 }]);
 const rows=await Promise.all(jobs.map(async([name,url,headers,parse])=>{
 try{const r=await providerFetch(url,{headers:{Accept:'application/json',...headers},signal:AbortSignal.timeout(15000)});
 if(r.status===429)return {name,status:'rate_limited' as const};
 if([401,402,403].includes(r.status))return {name,status:'access_denied' as const};
 if(r.status===404)return {name,status:'not_found' as const};if(!r.ok)return {name,status:'unavailable' as const};
 const body=await r.json();const food=parse(body);return {name,status:food?'found' as const:(body.status===0?'not_found' as const:'incomplete' as const),food};
 }catch{return {name,status:'unavailable' as const};}}));
 const sources:SourceStatus[]=rows.map(({name,status})=>({name,status}));
 if(!keys.perek)sources.unshift({name:'perek.us',status:'not_configured'});
 if(!keys.usda)sources.push({name:'USDA онлайн',status:'not_configured'});
 return {foods:rows.flatMap(x=>x.food?[x.food]:[]),sources};
}

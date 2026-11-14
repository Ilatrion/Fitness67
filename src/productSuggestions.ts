import type {Product} from './scannerCatalog';
export type Preference='protein'|'carbs'|'fat';
export function recentUses(logs:{product:Product;date:string;done:boolean}[],selected:Product,today:string){
 const start=new Date(today+'T12:00:00');start.setDate(start.getDate()-6);const lower=`${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(start.getDate()).padStart(2,'0')}`;
 return logs.filter(e=>e.done&&e.date>=lower&&e.date<=today&&e.product.barcode.padStart(14,'0')===selected.barcode.padStart(14,'0')).length;
}
export function alternatives(selected:Product,products:Product[],preference:Preference){
 const seen=new Set<string>();
 return products.filter(p=>{
  const c=p.barcode.padStart(14,'0');if(c===selected.barcode.padStart(14,'0')||seen.has(c)||p.unit!==selected.unit)return false;
  const difference=preference==='fat'?selected.fat-p.fat:p[preference]-selected[preference];
  if(difference<2)return false;seen.add(c);return true;
 }).sort((a,b)=>preference==='fat'?a.fat-b.fat:b[preference]-a[preference]).slice(0,3);
}

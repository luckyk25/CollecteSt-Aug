import dataset from './streets.json' with {type:'json'};
import {classifyPoint} from './sectors.mjs';
import {SmsError} from './sms-core.mjs';
export const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
function streetKey(s){return normalize(s).replace(/^(?:rue|route|chemin|rang|avenue|boulevard|rte|ch|boul|av|rg)\s+/,'').replace(/^(?:de la|de l|des|du|de|la|le|l)\s+/,'');}
const index=dataset.streets.map(s=>({...s,key:streetKey(s.name)}));
export function parseAddress(input){
 let text=String(input||'').trim();if(text.length<3||text.length>160)throw new SmsError(400,'Saisissez une adresse ou un nom de rue de Saint-Augustin-de-Desmaures.','invalid_address');
 text=text.replace(/,?\s+(?:Saint|St)[-\s]Augustin[-\s]de[-\s]Desmaures.*$/i,'').replace(/,?\s+(?:QC|Québec|Quebec)(?:\s+G\d[A-Z]\s?\d[A-Z]\d)?$/i,'').replace(/[ ,]+$/,'');
 let civic=null,street=text;const match=/^(\d+)([a-d]?)\s*[, ]\s*(.+)$/i.exec(text);
 if(match&&!/^\d+(?:e|er|eme|ème)\s+(?:rang|rue|avenue)\b/i.test(text)){civic=Number(match[1]);street=match[3];}
 return {civic,suffix:match?.[2]||'',street,key:streetKey(street)};
}
function distance(a,b){return Math.hypot((a[0]-b[0])*76300,(a[1]-b[1])*111200);}
function pointAlong(path,fraction){const lengths=path.slice(1).map((p,i)=>distance(path[i],p)),total=lengths.reduce((a,b)=>a+b,0);let target=total*Math.max(0,Math.min(1,fraction));for(let i=0;i<lengths.length;i++){if(target<=lengths[i]){const f=lengths[i]?target/lengths[i]:0;return [path[i][0]+(path[i+1][0]-path[i][0])*f,path[i][1]+(path[i+1][1]-path[i][1])*f];}target-=lengths[i];}return path.at(-1);}
export function lookupAddress(input){
 const parsed=parseAddress(input);let matches=index.filter(s=>s.key===parsed.key||normalize(s.name)===normalize(parsed.street));
 if(!matches.length){const similar=index.filter(s=>s.key.startsWith(parsed.key)||s.key.includes(parsed.key));return {status:'not_found',error:'Adresse non reconnue dans le répertoire municipal. Vérifiez le nom de rue et le numéro civique.',suggestions:similar.slice(0,6).map(s=>s.name)};}
 if(matches.length>1)return {status:'ambiguous',error:'Plusieurs rues correspondent. Précisez le nom complet.',suggestions:matches.map(s=>s.name)};
 const street=matches[0],points=[];
 if(parsed.civic!==null){
  for(const segment of street.segments)for(const [start,end] of segment.ranges){
   if(parsed.civic<Math.min(start,end)||parsed.civic>Math.max(start,end)||parsed.civic%2!==start%2)continue;
   const path=segment.paths.flat(),f=start===end?.5:(parsed.civic-start)/(end-start);points.push(pointAlong(path,f));
  }
  if(!points.length)return {status:'not_found',error:'Ce numéro civique n’est pas dans les plages d’adresses municipales de cette rue. Vérifiez le numéro ou recherchez le nom de rue seul.'};
 }else{
  for(const segment of street.segments)for(const path of segment.paths){points.push(path[0],pointAlong(path,.25),pointAlong(path,.5),pointAlong(path,.75),path.at(-1));}
 }
 const classified=points.map(classifyPoint),sectors=[...new Set(classified.map(p=>p.sector).filter(Boolean))];
 const address=(parsed.civic===null?'':parsed.civic+parsed.suffix+', ')+street.name;
 if(sectors.length!==1){return {status:parsed.civic===null?'needs_number':'needs_confirmation',streetId:street.id,address,error:parsed.civic===null?'Cette rue traverse plusieurs secteurs. Ajoutez votre numéro civique.':'L’adresse est proche d’une limite de secteur. Vérifiez la carte officielle.',sector:null};}
 const sector=sectors[0];
 const uncertain=classified.some(x=>!x.certain);
 return {status:uncertain?'needs_confirmation':'matched',streetId:street.id,address,sector,method:'map_estimate',confidence:uncertain?'boundary':'interior',message:uncertain?'L’adresse est proche d’une limite sur la carte. Confirmez le secteur avant de vous fier aux dates.':'Secteur estimé automatiquement à partir du répertoire municipal et de la carte officielle 2026.'};
}
export function resolveSelection(address,streetId,confirmedSector){
 const result=lookupAddress(address);
 if(result.streetId!==String(streetId))throw new SmsError(400,'L’adresse sélectionnée n’est plus valide. Recherchez-la de nouveau.','invalid_address');
 if(['needs_confirmation','matched'].includes(result.status)&&[1,2,3,4].includes(confirmedSector))return {...result,sector:confirmedSector,method:'manual_confirmation'};
 if(result.status!=='matched')throw new SmsError(400,result.error||result.message||'Précisez votre adresse pour déterminer le secteur.','address_uncertain');
 return result;
}

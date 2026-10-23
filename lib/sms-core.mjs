import {eventsForSector,todayInQuebec,hourInQuebec,addDays,formatDate,TYPES} from '../public/schedule.mjs';
export const CONSENT_VERSION='2026-10-20-v1';
export const CONSENT_TEXT='Je demande à Ma collecte de m’envoyer un rappel SMS à 18 h, la veille des collectes sélectionnées. Fréquence selon le calendrier. Des frais de messagerie peuvent s’appliquer. Je peux me désabonner dans l’application ou en répondant STOP.';
export const REQUIRED_SECRETS=['TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_VERIFY_SERVICE_SID','TWILIO_MESSAGING_SERVICE_SID'];
export function providerReady(env){return env.SMS_ENABLED==='true'&&REQUIRED_SECRETS.every(k=>typeof env[k]==='string'&&env[k].length>5)&&!!env.DB;}
export function smsReady(env){return providerReady(env)&&env.SMS_SCHEDULER_READY==='true';}
export function normalizePhone(value){const d=String(value||'').replace(/[^\d]/g,'');const p=d.length===10?'1'+d:d;return /^1[2-9]\d{2}[2-9]\d{6}$/.test(p)?'+'+p:null;}
export function maskPhone(phone){return '+1 ••• ••• '+phone.slice(-4);}
export function validTypes(value){return Array.isArray(value)&&value.length>0&&value.length<=4&&value.every(t=>Object.hasOwn(TYPES,t))?[...new Set(value)]:null;}
export function tomorrowCollections(sector,types,now=new Date()){const date=addDays(todayInQuebec(now),1);return eventsForSector(sector).filter(e=>e.date===date&&types.includes(e.type));}
export function messageFor(events){if(!events.length)return null;const names={garbage:'bac noir',recycling:'bac bleu',green:'sacs de papier',bulky:'encombrants (inscription requise)'};const day=formatDate(events[0].date).normalize('NFD').replace(/[\u0300-\u036f]/g,'');return `Ma collecte : demain ${day}, ${events.map(e=>names[e.type]).join(' + ')} avant 7 h. STOP pour arreter.`;}
export class SmsError extends Error{constructor(status,message,code='sms_error'){super(message);this.status=status;this.code=code;}}
export async function twilioRequest(env,path,values,fetcher=fetch){
 const base=path.startsWith('verify:')?'https://verify.twilio.com/v2/':'https://api.twilio.com/2010-04-01/';
 const actual=path.replace(/^verify:/,'');
 let res;try{res=await fetcher(base+actual,{method:'POST',headers:{Authorization:'Basic '+btoa(env.TWILIO_ACCOUNT_SID+':'+env.TWILIO_AUTH_TOKEN),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(values),signal:AbortSignal.timeout(15000)});}catch{throw new SmsError(502,'Le service de SMS ne répond pas. Réessayez plus tard.','provider_unknown');}
 let data;try{data=await res.json();}catch{throw new SmsError(502,'Réponse inattendue du service SMS.','provider_unknown');}
 if(!res.ok){const code=String(data.code||'provider_rejected');throw new SmsError(code==='21610'?409:502,code==='21610'?'Ce numéro est désabonné auprès du service SMS.':'Le service SMS a refusé la demande. Réessayez plus tard.',code);}
 return data;
}
export async function rateLimit(db,key,now=new Date(),cooldown=60){
 const day=todayInQuebec(now),ms=now.getTime();
 const prev=await db.prepare('SELECT day, count, last_at FROM sms_rate_limits WHERE key = ?').bind(key).first();
 if(prev&&ms-prev.last_at<cooldown*1000)throw new SmsError(429,'Veuillez attendre une minute avant de demander un nouveau code.','rate_limited');
 const row=await db.prepare('INSERT INTO sms_rate_limits (key, day, count, last_at) VALUES (?, ?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = CASE WHEN day = excluded.day THEN count + 1 ELSE 1 END, day = excluded.day, last_at = excluded.last_at RETURNING count').bind(key,day,ms).first();
 if(row.count>4)throw new SmsError(429,'La limite de codes pour aujourd’hui est atteinte. Réessayez demain.','rate_limited');
}
export async function startChallenge(env,userId,input,address,fetcher=fetch,now=new Date()){
 if(!smsReady(env))throw new SmsError(503,'Les rappels SMS sont en préparation. Aucun abonnement n’a été créé.','not_configured');
 if(todayInQuebec(now)>'2026-12-31')throw new SmsError(409,'Le calendrier 2026 est terminé. Les rappels sont suspendus.','calendar_ended');
 const phone=normalizePhone(input.phone),types=validTypes(input.types);
 if(!phone||!types||input.consent!==true)throw new SmsError(400,'Indiquez un numéro +1 valide, choisissez vos collectes et acceptez les rappels.','invalid_input');
 if(!address?.sector)throw new SmsError(400,'Recherchez d’abord votre adresse pour déterminer le secteur.','address_required');
 await rateLimit(env.DB,'user:'+userId,now);
 const phoneHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(phone)))).map(n=>n.toString(16).padStart(2,'0')).join('');
 await rateLimit(env.DB,'phone:'+phoneHash,now);
 const other=await env.DB.prepare('SELECT user_id FROM sms_subscriptions WHERE phone = ? AND user_id <> ?').bind(phone,userId).first();
 if(other)throw new SmsError(409,'Ce numéro est déjà associé à un abonnement.','already_subscribed');
 const challengeId=crypto.randomUUID(),at=now.toISOString();
 const data=await twilioRequest(env,`verify:Services/${env.TWILIO_VERIFY_SERVICE_SID}/Verifications`,{To:phone,Channel:'sms',Locale:'fr'},fetcher);
 if(data.status!=='pending')throw new SmsError(502,'Le code de vérification n’a pas pu être préparé.','provider_rejected');
 await env.DB.prepare('INSERT INTO sms_challenges (user_id, challenge_id, phone, address, street_id, sector, types, consent_at, expires_at, attempts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0) ON CONFLICT(user_id) DO UPDATE SET challenge_id=excluded.challenge_id, phone=excluded.phone, address=excluded.address, street_id=excluded.street_id, sector=excluded.sector, types=excluded.types, consent_at=excluded.consent_at, expires_at=excluded.expires_at, attempts=0').bind(userId,challengeId,phone,address.address,address.streetId,address.sector,JSON.stringify(types),at,now.getTime()+600000).run();
 return {challengeId,phone:maskPhone(phone),message:'Un code de vérification a été demandé. Saisissez-le pour activer les rappels.'};
}
export async function verifyChallenge(env,userId,input,fetcher=fetch,now=new Date()){
 if(!smsReady(env))throw new SmsError(503,'Les rappels SMS ne sont pas encore activés.','not_configured');
 if(!/^[0-9]{6}$/.test(String(input.code||'')))throw new SmsError(400,'Saisissez le code à 6 chiffres reçu par SMS.','invalid_code');
 const row=await env.DB.prepare('UPDATE sms_challenges SET attempts=attempts+1 WHERE user_id=? AND challenge_id=? AND expires_at>? AND attempts<5 RETURNING *').bind(userId,String(input.challengeId||''),now.getTime()).first();
 if(!row)throw new SmsError(400,'Ce code a expiré ou le nombre d’essais est atteint. Demandez un nouveau code.','challenge_expired');
 const result=await twilioRequest(env,`verify:Services/${env.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,{To:row.phone,Code:String(input.code)},fetcher);
 if(result.status!=='approved')throw new SmsError(400,'Le code est incorrect. Réessayez.','invalid_code');
 const at=now.toISOString();
 try{await env.DB.batch([
  env.DB.prepare('INSERT INTO sms_subscriptions (user_id,phone,address,street_id,sector,types,consent_at,consent_version,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET phone=excluded.phone,address=excluded.address,street_id=excluded.street_id,sector=excluded.sector,types=excluded.types,consent_at=excluded.consent_at,consent_version=excluded.consent_version,updated_at=excluded.updated_at').bind(userId,row.phone,row.address,row.street_id,row.sector,row.types,row.consent_at,CONSENT_VERSION,at,at),
  env.DB.prepare('DELETE FROM sms_challenges WHERE user_id=?').bind(userId)
 ]);}catch{throw new SmsError(409,'Cet abonnement n’a pas pu être enregistré. Vérifiez si ce numéro est déjà abonné.','subscription_conflict');}
 return {active:true,phone:maskPhone(row.phone),address:row.address,sector:row.sector,types:JSON.parse(row.types),reminder:'La veille à 18 h · Heure du Québec'};
}
export async function readSubscription(env,userId){const row=env.DB?await env.DB.prepare('SELECT phone,address,sector,types FROM sms_subscriptions WHERE user_id=?').bind(userId).first():null;return row?{active:true,phone:maskPhone(row.phone),address:row.address,sector:row.sector,types:JSON.parse(row.types)}:{active:false};}
export async function unsubscribe(env,userId){if(env.DB)await env.DB.batch(['sms_subscriptions','sms_challenges','sms_deliveries'].map(table=>env.DB.prepare(`DELETE FROM ${table} WHERE user_id=?`).bind(userId)));return {active:false,message:'Vous êtes désabonné. Votre numéro et votre adresse ont été supprimés du service de rappels.'};}
export async function dispatchReminders(env,{now=new Date(),dryRun=false,fetcher=fetch}={}){
 if(!smsReady(env))return {ready:false,status:'not_configured',sent:0};
 if(todayInQuebec(now)>'2026-12-31')return {ready:true,status:'calendar_ended',sent:0};
 const rows=await env.DB.prepare('SELECT * FROM sms_subscriptions ORDER BY user_id').all();
 const eligible=rows.results.map(row=>({row,events:tomorrowCollections(row.sector,JSON.parse(row.types),now)})).filter(x=>x.events.length);
 if(dryRun)return {ready:true,status:'dry_run',eligible:eligible.length,sent:0};
 if(hourInQuebec(now)!==18)return {ready:true,status:'outside_delivery_window',sent:0};
 let accepted=0,skipped=0,failed=0,uncertain=0;
 for(const {row,events} of eligible){
  const id=crypto.randomUUID(),date=events[0].date,at=now.toISOString();
  const claim=await env.DB.prepare('INSERT OR IGNORE INTO sms_deliveries (id,user_id,collection_date,status,created_at,updated_at) VALUES (?,?,?,?,?,?) RETURNING id').bind(id,row.user_id,date,'sending',at,at).first();
  if(!claim){skipped++;continue;}
  // Recheck consent after claiming, so an unsubscribed or replaced phone is never queued from a stale snapshot.
  const active=await env.DB.prepare('SELECT phone FROM sms_subscriptions WHERE user_id=? AND phone=? AND updated_at=?').bind(row.user_id,row.phone,row.updated_at).first();
  if(!active){await env.DB.prepare('UPDATE sms_deliveries SET status=?,updated_at=? WHERE id=?').bind('cancelled',at,id).run();skipped++;continue;}
  try{
   const response=await twilioRequest(env,`Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,{To:row.phone,MessagingServiceSid:env.TWILIO_MESSAGING_SERVICE_SID,Body:messageFor(events)},fetcher);
   if(!response.sid)throw new SmsError(502,'Réponse SMS incertaine.','provider_unknown');
   await env.DB.prepare('UPDATE sms_deliveries SET status=?,provider_sid=?,updated_at=? WHERE id=?').bind('accepted',response.sid,at,id).run();accepted++;
  }catch(error){
   const status=!(error instanceof SmsError)||error.code==='provider_unknown'?'uncertain':'rejected';
   await env.DB.prepare('UPDATE sms_deliveries SET status=?,updated_at=? WHERE id=?').bind(status,at,id).run();
   if(status==='uncertain')uncertain++;else failed++;
   if(error.code==='21610')await unsubscribe(env,row.user_id);
  }
 }
 // A receipt from Twilio means accepted for delivery, not delivery to the handset.
 return {ready:true,status:'completed',accepted,skipped,failed,uncertain};
}

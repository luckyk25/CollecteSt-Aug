import {SmsError, validTypes, tomorrowCollections} from './sms-core.mjs';
import {todayInQuebec, hourInQuebec, formatDate, TYPES} from '../public/schedule.mjs';

export class TelegramError extends SmsError {}
export const TELEGRAM_CONSENT_VERSION='2026-10-22-v1';
export function telegramConfigured(env){
 return env.TELEGRAM_ENABLED==='true' && !!env.DB && /^\d{5,}:[\w-]{20,}$/.test(env.TELEGRAM_BOT_TOKEN||'') && /^[A-Za-z][A-Za-z0-9_]{3,30}bot$/i.test(env.TELEGRAM_BOT_USERNAME||'');
}
export function telegramReady(env){return telegramConfigured(env)&&env.TELEGRAM_SCHEDULER_READY==='true';}
const fail=(status,message,code)=>new TelegramError(status,message,code);
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
function requireReady(env){if(!telegramReady(env))throw fail(503,'Les rappels Telegram ne sont pas encore activés.','not_configured');}
function requireCalendar(now){if(todayInQuebec(now)>'2026-12-31')throw fail(409,'Le calendrier 2026 est terminé. Les rappels sont suspendus.','calendar_ended');}

// Bot credentials only leave the server in requests to Telegram's official API.
export async function telegramRequest(env,method,values={},fetcher=fetch){
 if(!['getMe','getUpdates','sendMessage','setMyCommands','setMyDescription','setMyShortDescription'].includes(method))throw fail(400,'Opération Telegram invalide.','invalid_operation');
 let response,data;
 try{
  response=await fetcher(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values),signal:AbortSignal.timeout(15000)});
  data=await response.json();
 }catch{throw fail(502,'Telegram ne répond pas. Aucun nouvel envoi ne sera tenté automatiquement.','provider_unknown');}
 if(!response.ok||data.ok!==true){
  const code=data.error_code||response.status;
  throw fail(code===403?409:502,code===403?'Ce compte a bloqué le bot. Reconnectez-le dans Telegram.':code===429?'La limite Telegram est atteinte. Réessayez plus tard.':'Telegram a refusé la demande.',code===403?'blocked':code>=500?'provider_unknown':'provider_rejected');
 }
 return data.result;
}
export async function sendTelegram(env,chatId,text,fetcher=fetch){
 const result=await telegramRequest(env,'sendMessage',{chat_id:chatId,text,link_preview_options:{is_disabled:true}},fetcher);
 if(!Number.isInteger(result?.message_id)||String(result?.chat?.id)!==String(chatId))throw fail(502,'La confirmation d’envoi Telegram est incertaine.','provider_unknown');
 return String(result.message_id);
}

export async function createTelegramLink(env,ownerId,input,address,now=new Date()){
 requireReady(env);requireCalendar(now);
 const types=validTypes(input.types);
 if(!types||input.consent!==true||!address?.sector)throw fail(400,'Choisissez votre adresse et vos collectes, puis acceptez les rappels.','invalid_input');
 await env.DB.prepare('DELETE FROM telegram_invites WHERE expires_at <= ?').bind(now.getTime()).run();
 await env.DB.prepare("DELETE FROM telegram_state WHERE key LIKE 'link:%' AND until_at <= ?").bind(now.getTime()).run();
 const token=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(n=>n.toString(16).padStart(2,'0')).join('');
 const id=crypto.randomUUID(),expires=now.getTime()+20*60000;
 // The limit is checked within the insert so concurrent requests cannot bypass it.
 const created=await env.DB.prepare('INSERT INTO telegram_invites (id,owner_id,token_hash,address,street_id,sector,types,expires_at,created_at) SELECT ?,?,?,?,?,?,?,?,? WHERE (SELECT count(*) FROM telegram_subscriptions WHERE owner_id=?)+(SELECT count(*) FROM telegram_invites WHERE owner_id=?)<10 RETURNING id').bind(id,ownerId,await hash(token),address.address,address.streetId,address.sector,JSON.stringify(types),expires,now.toISOString(),ownerId,ownerId).first();
 if(!created)throw fail(409,'Vous pouvez connecter jusqu’à 10 comptes. Supprimez un ancien lien ou un abonnement.','family_limit');
 return {id,url:`https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${token}`,expiresAt:new Date(expires).toISOString()};
}
export async function telegramStatus(env,ownerId,inviteId=''){
 const rows=env.DB?(await env.DB.prepare('SELECT id,display_name,username,address,sector,types FROM telegram_subscriptions WHERE owner_id=? ORDER BY created_at').bind(ownerId).all()).results:[];
 const connected=env.DB&&inviteId?await env.DB.prepare('SELECT value FROM telegram_state WHERE key=?').bind('link:'+ownerId+':'+inviteId).first():null;
 return {ready:telegramReady(env),botUsername:env.TELEGRAM_BOT_USERNAME||null,linkConnected:!!connected,recipients:rows.map(r=>({id:r.id,name:r.display_name,username:r.username,address:r.address,sector:r.sector,types:JSON.parse(r.types)}))};
}
export async function removeTelegramRecipient(env,ownerId,id){
 await env.DB.batch([
  env.DB.prepare('DELETE FROM telegram_deliveries WHERE recipient_id IN (SELECT id FROM telegram_subscriptions WHERE owner_id=? AND id=?)').bind(ownerId,id),
  env.DB.prepare("DELETE FROM telegram_state WHERE value IN (SELECT id FROM telegram_subscriptions WHERE owner_id=? AND id=?) AND key LIKE 'link:%'").bind(ownerId,id),
  env.DB.prepare('DELETE FROM telegram_state WHERE key=? AND EXISTS (SELECT 1 FROM telegram_subscriptions WHERE owner_id=? AND id=?)').bind('test:'+id,ownerId,id),
  env.DB.prepare('DELETE FROM telegram_subscriptions WHERE owner_id=? AND id=?').bind(ownerId,id),
  env.DB.prepare('DELETE FROM telegram_invites WHERE owner_id=? AND id=?').bind(ownerId,id)
 ]);
 return {message:'Cet abonnement et ses données ont été supprimés.'};
}
async function removeByChat(env,chatId){
 const row=await env.DB.prepare('SELECT id,owner_id FROM telegram_subscriptions WHERE chat_id=?').bind(chatId).first();
 if(row)await removeTelegramRecipient(env,row.owner_id,row.id);
}
async function reply(env,chatId,text,fetcher){
 try{await sendTelegram(env,chatId,text,fetcher);}catch(e){if(e.code==='blocked')await removeByChat(env,chatId);}
}
async function handleUpdate(env,update,fetcher,now){
 const membership=update.my_chat_member;
 if(membership?.chat?.type==='private'&&membership.new_chat_member?.status==='kicked'){
  await removeByChat(env,String(membership.chat.id));return;
 }
 const message=update.message;
 if(message?.chat?.type!=='private'||!message.from||message.from.is_bot||message.from.id!==message.chat.id)return;
 const chatId=String(message.chat.id),text=String(message.text||'').trim();
 if(/^\/(stop|unsubscribe|arreter)(?:@\w+)?(?:\s|$)/i.test(text)){
  await removeByChat(env,chatId);
  await reply(env,chatId,'Vous êtes désabonné de Ma collecte. Vos données de rappel ont été supprimées. Pour recommencer, demandez un nouveau lien depuis le site.',fetcher);return;
 }
 if(/^\/status(?:@\w+)?(?:\s|$)/i.test(text)){
  const row=await env.DB.prepare('SELECT sector,types FROM telegram_subscriptions WHERE chat_id=?').bind(chatId).first();
  await reply(env,chatId,row?`Ma collecte : rappels activés pour le secteur ${row.sector}, la veille à 18 h (heure du Québec). Collectes : ${JSON.parse(row.types).map(t=>TYPES[t].label).join(', ')}. /stop pour arrêter.`:'Aucun abonnement actif. Ouvrez un lien de connexion créé sur le site Ma collecte.',fetcher);return;
 }
 const match=/^\/start(?:@\w+)? ([a-f0-9]{64})$/.exec(text);
 if(!match){if(text.startsWith('/'))await reply(env,chatId,'Bienvenue dans Ma collecte. Ouvrez le lien de connexion créé sur le site, puis appuyez sur Démarrer. /status : mes rappels · /stop : me désabonner.',fetcher);return;}
 requireCalendar(now);
 const invite=await env.DB.prepare('SELECT * FROM telegram_invites WHERE token_hash=? AND expires_at>?').bind(await hash(match[1]),now.getTime()).first();
 if(!invite){await reply(env,chatId,'Ce lien a expiré ou a déjà été utilisé. Demandez un nouveau lien depuis Ma collecte.',fetcher);return;}
 const existing=await env.DB.prepare('SELECT id,owner_id FROM telegram_subscriptions WHERE chat_id=?').bind(chatId).first();
 if(existing&&existing.owner_id!==invite.owner_id){await reply(env,chatId,'Ce compte est déjà connecté à une autre famille. Utilisez /stop avant de le reconnecter.',fetcher);return;}
 const at=now.toISOString(),name=String([message.from.first_name,message.from.last_name].filter(Boolean).join(' ')||message.from.username||'Compte Telegram').slice(0,100);
 // Consuming the one-time invite and recording opt-in are one transaction.
 await env.DB.batch([
  env.DB.prepare('INSERT INTO telegram_subscriptions (id,owner_id,chat_id,display_name,username,address,street_id,sector,types,consent_at,consent_version,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(chat_id) DO UPDATE SET display_name=excluded.display_name,username=excluded.username,address=excluded.address,street_id=excluded.street_id,sector=excluded.sector,types=excluded.types,consent_at=excluded.consent_at,consent_version=excluded.consent_version,updated_at=excluded.updated_at').bind(invite.id,invite.owner_id,chatId,name,String(message.from.username||'').slice(0,64),invite.address,invite.street_id,invite.sector,invite.types,at,TELEGRAM_CONSENT_VERSION,at,at),
  env.DB.prepare('DELETE FROM telegram_invites WHERE id=?').bind(invite.id),
  env.DB.prepare('INSERT INTO telegram_state (key,value,until_at) VALUES (?,?,?)').bind('link:'+invite.owner_id+':'+invite.id,existing?.id||invite.id,now.getTime()+20*60000)
 ]);
 await reply(env,chatId,`Vos rappels Ma collecte sont activés. Secteur ${invite.sector} · ${JSON.parse(invite.types).map(t=>TYPES[t].label).join(', ')}. Nous vous préviendrons la veille à 18 h, heure du Québec. /stop pour arrêter.`,fetcher);
}

// Polling preserves the Site's private audience; no public webhook is needed.
// Browser polling handles pairing promptly. The cloud task also drains commands
// before sending reminders, so /stop is applied before the next reminder.
export async function syncTelegram(env,{fetcher=fetch,now=new Date(),clock=()=>Date.now()}={}){
 if(!telegramConfigured(env))return {status:'not_configured',caughtUp:false};
 const lease=crypto.randomUUID(),ms=now.getTime(),started=clock();
 const lock=await env.DB.prepare("INSERT INTO telegram_state (key,value,until_at) VALUES ('sync_lease',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,until_at=excluded.until_at WHERE until_at<=? RETURNING value").bind(lease,ms+120000,ms).first();
 if(!lock)return {status:'busy',caughtUp:false};
 let processed=0;
 try{
  await env.DB.batch([
   env.DB.prepare('DELETE FROM telegram_invites WHERE expires_at<=?').bind(ms),
   env.DB.prepare("DELETE FROM telegram_state WHERE key LIKE 'link:%' AND until_at<=?").bind(ms)
  ]);
  const saved=await env.DB.prepare("SELECT value FROM telegram_state WHERE key='offset'").first();
  let offset=Number(saved?.value||0);
  for(let page=0;page<5;page++){
   const updates=await telegramRequest(env,'getUpdates',{offset,limit:50,timeout:0,allowed_updates:['message','my_chat_member']},fetcher);
   if(!Array.isArray(updates))throw fail(502,'Réponse Telegram invalide.','provider_unknown');
   for(const update of updates){
    if(!Number.isSafeInteger(update.update_id)||update.update_id<offset)continue;
    // Bound each worker invocation; the persisted offset resumes the next batch.
    const elapsed=Math.max(0,clock()-started);
    if(elapsed>=45000)return {status:'backlog',caughtUp:false,processed};
    const currentMs=ms+elapsed;
    const renewed=await env.DB.prepare("UPDATE telegram_state SET until_at=? WHERE key='sync_lease' AND value=? AND until_at>? RETURNING value").bind(currentMs+120000,lease,currentMs).first();
    if(!renewed)return {status:'busy',caughtUp:false,processed};
    await handleUpdate(env,update,fetcher,now);
    offset=update.update_id+1;
    await env.DB.prepare("INSERT INTO telegram_state (key,value,until_at) VALUES ('offset',?,0) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(offset)).run();processed++;
   }
   if(updates.length<50)return {status:'synced',caughtUp:true,processed};
  }
  return {status:'backlog',caughtUp:false,processed};
 }finally{await env.DB.prepare("DELETE FROM telegram_state WHERE key='sync_lease' AND value=?").bind(lease).run();}
}
export function telegramReminder(events){
 if(!events.length)return null;
 return `Ma collecte · Demain, ${formatDate(events[0].date)}\n\n${events.map(e=>TYPES[e.type].label+' : '+TYPES[e.type].short).join('\n')}\n\nÀ sortir avant 7 h.${events.some(e=>e.type==='bulky')?' Encombrants : inscription municipale obligatoire.':''}\n/stop pour arrêter les rappels.`;
}
export async function dispatchTelegram(env,{now=new Date(),dryRun=false,fetcher=fetch}={}){
 if(!telegramReady(env))return {ready:false,status:'not_configured',accepted:0};
 if(todayInQuebec(now)>'2026-12-31')return {ready:true,status:'calendar_ended',accepted:0};
 if(!dryRun){
  const sync=await syncTelegram(env,{fetcher,now});
  if(!sync.caughtUp)return {ready:true,status:sync.status,accepted:0};
 }
 if(!dryRun&&hourInQuebec(now)!==18)return {ready:true,status:'outside_delivery_window',accepted:0};
 const rows=(await env.DB.prepare('SELECT * FROM telegram_subscriptions ORDER BY id').all()).results;
 const eligible=rows.map(row=>({row,events:tomorrowCollections(row.sector,JSON.parse(row.types),now)})).filter(x=>x.events.length);
 if(dryRun)return {ready:true,status:'dry_run',eligible:eligible.length,accepted:0};
 let accepted=0,skipped=0,failed=0,uncertain=0;
 for(const {row,events} of eligible){
  const id=crypto.randomUUID(),at=now.toISOString();
  const claim=await env.DB.prepare('INSERT OR IGNORE INTO telegram_deliveries (id,recipient_id,collection_date,status,created_at,updated_at) VALUES (?,?,?,?,?,?) RETURNING id').bind(id,row.id,events[0].date,'sending',at,at).first();
  if(!claim){skipped++;continue;}
  const active=await env.DB.prepare('SELECT chat_id FROM telegram_subscriptions WHERE id=? AND chat_id=? AND updated_at=?').bind(row.id,row.chat_id,row.updated_at).first();
  if(!active){await env.DB.prepare('UPDATE telegram_deliveries SET status=? WHERE id=?').bind('cancelled',id).run();skipped++;continue;}
  try{
   const messageId=await sendTelegram(env,row.chat_id,telegramReminder(events),fetcher);
   await env.DB.prepare('UPDATE telegram_deliveries SET status=?,message_id=?,updated_at=? WHERE id=?').bind('accepted',messageId,at,id).run();accepted++;
  }catch(error){
   const status=!(error instanceof TelegramError)||error.code==='provider_unknown'?'uncertain':'rejected';
   await env.DB.prepare('UPDATE telegram_deliveries SET status=?,updated_at=? WHERE id=?').bind(status,at,id).run();
   if(status==='uncertain')uncertain++;else failed++;
   if(error.code==='blocked')await removeByChat(env,row.chat_id);
  }
 }
 return {ready:true,status:'completed',accepted,skipped,failed,uncertain};
}
export async function testTelegramRecipient(env,ownerId,id,{now=new Date(),fetcher=fetch}={}){
 requireReady(env);
 const row=await env.DB.prepare('SELECT chat_id FROM telegram_subscriptions WHERE owner_id=? AND id=?').bind(ownerId,id).first();
 if(!row)throw fail(404,'Cet abonnement est introuvable.','not_found');
 const key='test:'+id,ms=now.getTime();
 const claim=await env.DB.prepare('INSERT INTO telegram_state (key,value,until_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET until_at=excluded.until_at WHERE until_at<=? RETURNING key').bind(key,'',ms+60000,ms).first();
 if(!claim)throw fail(429,'Attendez une minute avant de refaire ce test.','rate_limited');
 await sendTelegram(env,row.chat_id,'Test Ma collecte : vos notifications Telegram fonctionnent. Vos rappels arriveront la veille des collectes choisies à 18 h, heure du Québec. /stop pour arrêter.',fetcher);
 return {message:'Le message de test a été accepté par Telegram. Vérifiez sa réception sur votre téléphone.'};
}

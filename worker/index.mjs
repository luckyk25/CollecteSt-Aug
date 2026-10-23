import {json,body,failure,sameOrigin} from '../lib/api.mjs';
import {lookupAddress,resolveSelection} from '../lib/addresses.mjs';
import {telegramStatus,createTelegramLink,removeTelegramRecipient,testTelegramRecipient,processTelegramWebhook,dispatchTelegram} from '../lib/telegram-core.mjs';
import {anonymousSession,secure,rateLimit,secretMatches} from './security.mjs';
import {ensureTelegramWebhook,webhookReady} from './telegram-webhook.mjs';
export async function handleRequest(request,env,{fetcher=fetch,now=new Date()}={}){
 const path=new URL(request.url).pathname;
 if(!path.startsWith('/api/'))return env.ASSETS.fetch(request);
 let cookie,stage='routing';
 try{
  if(path==='/api/telegram/webhook'){
   if(request.method!=='POST')return secure(json({error:'Méthode non autorisée.'},405));
   if(request.headers.has('Origin')||!await secretMatches(request.headers.get('X-Telegram-Bot-Api-Secret-Token'),env.TELEGRAM_WEBHOOK_SECRET))return secure(json({error:'Accès refusé.'},403));
   const result=await processTelegramWebhook(env,await body(request,32768),{fetcher,now});
   return secure(json({ok:true,status:result.status}));
  }
  if(path==='/api/address'&&request.method==='GET'){
   await rateLimit(env,request,'address',now);
   return secure(json(lookupAddress(new URL(request.url).searchParams.get('q'))));
  }
  const methods={'/api/telegram/status':'GET','/api/telegram/link':'POST','/api/telegram/subscription':'DELETE','/api/telegram/test':'POST'};
  if(!methods[path])return secure(json({error:'Introuvable.'},404));
  if(request.method!==methods[path])return secure(json({error:'Méthode non autorisée.'},405));
  if(request.method!=='GET')sameOrigin(request);
  else if(request.headers.get('Sec-Fetch-Site')==='cross-site')return secure(json({error:'Accès refusé.'},403));
  const action=path.split('/').at(-1);stage='rate_limit';await rateLimit(env,request,action,now);
  stage='anonymous_session';
  const session=await anonymousSession(request);cookie=session.cookie;
  if(action==='status'){
   stage='telegram_status';
   const status=await telegramStatus(env,session.ownerId,'',now);
   stage='webhook_configuration';
   status.ready=status.ready&&await webhookReady(env,now);
   return secure(json(status),cookie);
  }
  const input=await body(request);
  if(action==='link'){
   if(!await webhookReady(env,now))return secure(json({error:'Les rappels Telegram sont en cours d’activation. Réessayez dans quelques minutes.'},503),cookie);
   const selected=resolveSelection(input.address,input.streetId,input.confirmedSector);
   // The full street/civic address stays in the visitor's browser.
   const address={address:`Secteur ${selected.sector}`,streetId:'',sector:selected.sector};
   return secure(json(await createTelegramLink(env,session.ownerId,input,address,now)),cookie);
  }
  const id=typeof input.id==='string'?input.id:'';
  if(!/^[a-f0-9-]{36}$/.test(id))return secure(json({error:'Abonnement invalide.'},400),cookie);
  if(action==='subscription')return secure(json(await removeTelegramRecipient(env,session.ownerId,id)),cookie);
  return secure(json(await testTelegramRecipient(env,session.ownerId,id,{fetcher,now})),cookie);
 }catch(error){
  if(!Number.isInteger(error?.status))console.error(JSON.stringify({event:'request_failed',stage,kind:error instanceof TypeError?'type_error':'runtime_error'}));
  return secure(failure(error),cookie);
 }
}
export default {
 fetch:handleRequest,
 async scheduled(controller,env,ctx){
  ctx.waitUntil((async()=>{
   try{
    const now=new Date(controller.scheduledTime);
    if(!await ensureTelegramWebhook(env,{now}))return;
    const result=await dispatchTelegram(env,{now});
    // Logs contain aggregate counts only, never recipients, addresses or tokens.
    if(result.failed||result.uncertain)console.error(JSON.stringify({event:'reminder_delivery',failed:result.failed,uncertain:result.uncertain}));
   }catch{console.error(JSON.stringify({event:'reminder_dispatch_failed'}));throw new Error('Reminder task failed.');}
  })());
 }
};

import {telegramReady,telegramRequest} from '../lib/telegram-core.mjs';
import {digest} from './security.mjs';
import {TELEGRAM} from '../lib/config.mjs';

async function configuration(env){
 if(!telegramReady(env))return null;
 const origin=new URL(env.PUBLIC_ORIGIN);
 if(origin.protocol!=='https:'||origin.origin!==env.PUBLIC_ORIGIN||!/^\w{32,256}$/.test(env.TELEGRAM_WEBHOOK_SECRET||''))throw new Error('Invalid webhook configuration.');
 const url=origin.origin+'/api/telegram/webhook';
 return {url,fingerprint:await digest(JSON.stringify([url,env.TELEGRAM_BOT_USERNAME,env.TELEGRAM_BOT_TOKEN,env.TELEGRAM_WEBHOOK_SECRET]))};
}

export async function webhookReady(env,now=new Date()){
 const config=await configuration(env);if(!config)return false;
 const row=await env.DB.prepare("SELECT value,until_at FROM telegram_state WHERE key='webhook_config'").first();
 return row?.value===config.fingerprint&&row.until_at>now.getTime();
}

// Runs only in the native scheduled task. Credentials stay in the Worker.
export async function ensureTelegramWebhook(env,{fetcher=fetch,now=new Date()}={}){
 const config=await configuration(env);if(!config)return false;
 const saved=await env.DB.prepare("SELECT value,until_at FROM telegram_state WHERE key='webhook_config'").first();
 if(saved?.value===config.fingerprint&&saved.until_at>now.getTime()+TELEGRAM.webhookHealthMs-TELEGRAM.webhookCheckMs)return true;
 const info=await telegramRequest(env,'getWebhookInfo',{},fetcher);
 if(saved?.value!==config.fingerprint||info.url!==config.url){
  const bot=await telegramRequest(env,'getMe',{},fetcher);
  if(bot.username?.toLowerCase()!==env.TELEGRAM_BOT_USERNAME.toLowerCase())throw new Error('Unexpected Telegram bot.');
  const installed=await telegramRequest(env,'setWebhook',{url:config.url,secret_token:env.TELEGRAM_WEBHOOK_SECRET,max_connections:1,allowed_updates:['message','my_chat_member'],drop_pending_updates:false},fetcher);
  if(installed!==true)throw new Error('Webhook setup failed.');
  const confirmed=await telegramRequest(env,'getWebhookInfo',{},fetcher);
  if(confirmed.url!==config.url)throw new Error('Webhook verification failed.');
 }
 await env.DB.prepare("INSERT INTO telegram_state (key,value,until_at) VALUES ('webhook_config',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,until_at=excluded.until_at").bind(config.fingerprint,now.getTime()+TELEGRAM.webhookHealthMs).run();
 return true;
}

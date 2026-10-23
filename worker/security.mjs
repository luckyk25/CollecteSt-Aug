import {SmsError} from '../lib/sms-core.mjs';
export const SECURITY_HEADERS={
 'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; object-src 'none'",
 'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer',
 'Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=()',
 'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Resource-Policy':'same-origin',
 'Strict-Transport-Security':'max-age=31536000'
};
export function secure(response,cookie){
 const headers=new Headers(response.headers);
 for(const [name,value] of Object.entries(SECURITY_HEADERS))headers.set(name,value);
 headers.set('Cache-Control','no-store');
 if(cookie)headers.append('Set-Cookie',cookie);
 return new Response(response.body,{status:response.status,headers});
}
export const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(n=>n.toString(16).padStart(2,'0')).join('');
export async function anonymousSession(request){
 const local=['localhost','127.0.0.1'].includes(new URL(request.url).hostname);
 const name=local?'collecte_dev':'__Host-collecte';
 let token=(request.headers.get('Cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='))?.slice(name.length+1);
 if(!/^[a-f0-9]{64}$/.test(token||''))token=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(n=>n.toString(16).padStart(2,'0')).join('');
 return {ownerId:'anon:'+await digest(token),cookie:`${name}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=1209600${local?'':'; Secure'}`};
}
export async function secretMatches(actual,expected){
 if(!actual||!expected||actual.length>256)return false;
 const [a,b]=await Promise.all([digest(actual),digest(expected)]);let diff=0;
 for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
 return diff===0;
}
export async function rateLimit(env,request,action,now=new Date()){
 if(!env.DB||!env.RATE_LIMIT_SECRET)throw new SmsError(503,'Le service est en préparation.','not_configured');
 const ip=request.headers.get('CF-Connecting-IP')||'local';
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.RATE_LIMIT_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const ipHash=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(ip)))).map(n=>n.toString(16).padStart(2,'0')).join('');
 const day=now.toISOString().slice(0,10),hour=Math.floor(now.getTime()/3600000);
 const limits={link:[30,200],test:[10,200],subscription:[60,1000],status:[1200,20000],address:[200,10000]};
 const [perIp,global]=limits[action];
 await env.DB.prepare('DELETE FROM sms_rate_limits WHERE day<?').bind(day).run();
 for(const [id,max] of [[`cf:${action}:ip:${ipHash}:${hour}`,perIp],[`cf:${action}:all:${day}`,global]]){
  const claimed=await env.DB.prepare('INSERT INTO sms_rate_limits (key,day,count,last_at) VALUES (?,?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1,last_at=excluded.last_at WHERE count<? RETURNING count').bind(id,day,now.getTime(),max).first();
  if(!claimed)throw new SmsError(429,'Trop de demandes. Réessayez un peu plus tard.','rate_limited');
 }
}

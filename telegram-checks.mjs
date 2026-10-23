import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {createTelegramLink,telegramStatus,syncTelegram,dispatchTelegram,testTelegramRecipient,removeTelegramRecipient,telegramReady} from './lib/telegram-core.mjs';
const sqlite=new DatabaseSync(':memory:');
for(const name of readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort())sqlite.exec(readFileSync('drizzle/'+name,'utf8'));
const db={prepare(sql){return {async first(){return sqlite.prepare(sql).get()||null},async all(){return {results:sqlite.prepare(sql).all()}},bind(...v){return {async first(){return sqlite.prepare(sql).get(...v)||null},async all(){return {results:sqlite.prepare(sql).all(...v)}},async run(){return sqlite.prepare(sql).run(...v)}}}}},async batch(statements){sqlite.exec('BEGIN');try{const out=[];for(const q of statements)out.push(await q.run());sqlite.exec('COMMIT');return out;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
const env={DB:db,TELEGRAM_ENABLED:'true',TELEGRAM_SCHEDULER_READY:'true',TELEGRAM_BOT_TOKEN:'123456789:'+''.padEnd(32,'x'),TELEGRAM_BOT_USERNAME:'ma_collecte_test_bot'};
const now=new Date('2026-10-22T22:00:00Z'),address={address:'120 rue du Vitrier',streetId:'20067',sector:1},input={types:['garbage','recycling','green'],consent:true};
let updates=[],calls=[],nextMessage=1;
const fetcher=async(url,options)=>{
 const method=url.split('/').at(-1),body=JSON.parse(options.body);calls.push({method,body});
 if(method==='getUpdates')return Response.json({ok:true,result:updates.filter(x=>x.update_id>=body.offset).slice(0,body.limit)});
 if(method==='sendMessage')return Response.json({ok:true,result:{message_id:nextMessage++,chat:{id:Number(body.chat_id)}}});
 throw Error('Unexpected provider method');
};
const start=(id,chatId,link,extra={})=>({update_id:id,message:{chat:{id:chatId,type:'private'},from:{id:chatId,first_name:'Family '+chatId,username:'family_'+chatId,is_bot:false},text:'/start '+new URL(link.url).searchParams.get('start'),...extra}});
assert(telegramReady(env));assert(!telegramReady({...env,TELEGRAM_SCHEDULER_READY:'false'}));
await assert.rejects(createTelegramLink({...env,TELEGRAM_ENABLED:'false'},'owner',input,address,now),e=>e.code==='not_configured');
await assert.rejects(createTelegramLink(env,'owner',{...input,consent:false},address,now),e=>e.code==='invalid_input');
const link=await createTelegramLink(env,'owner',input,address,now);
const rawToken=new URL(link.url).searchParams.get('start');assert.equal(rawToken.length,64);
assert(!JSON.stringify(sqlite.prepare('SELECT * FROM telegram_invites').all()).includes(rawToken));
assert.equal((await telegramStatus(env,'owner')).recipients.length,0);
// A nickname, a phone number, another user's id, and group chats cannot opt in.
updates=[{update_id:1,message:{chat:{id:101,type:'private'},from:{id:202},text:'/start '+rawToken}},start(2,101,link,{chat:{id:101,type:'group'}})];
await syncTelegram(env,{now,fetcher});assert.equal((await telegramStatus(env,'owner')).recipients.length,0);
updates=[start(3,101,link)];await syncTelegram(env,{now,fetcher});
assert.equal((await telegramStatus(env,'owner')).recipients.length,1);assert.equal((await telegramStatus(env,'other')).recipients.length,0);
assert.equal(sqlite.prepare('SELECT count(*) AS n FROM telegram_invites').get().n,0);
assert.equal((await telegramStatus(env,'owner',link.id)).linkConnected,true);
assert.equal((await telegramStatus(env,'other',link.id)).linkConnected,false);
updates=[start(4,202,link)];await syncTelegram(env,{now,fetcher});assert.equal((await telegramStatus(env,'owner')).recipients.length,1);
// Different family members get independent subscriptions and preferences.
const second=await createTelegramLink(env,'owner',{...input,types:['garbage']},address,now);
updates=[start(5,202,second)];await syncTelegram(env,{now,fetcher});
let recipients=(await telegramStatus(env,'owner')).recipients;assert.equal(recipients.length,2);
await assert.rejects(testTelegramRecipient(env,'other',recipients[0].id,{now,fetcher}),e=>e.code==='not_found');
await testTelegramRecipient(env,'owner',recipients[0].id,{now,fetcher});
await assert.rejects(testTelegramRecipient(env,'owner',recipients[0].id,{now,fetcher}),e=>e.code==='rate_limited');
const before=calls.length,dry=await dispatchTelegram(env,{now:new Date('2026-10-25T22:00:00Z'),dryRun:true,fetcher});
assert.equal(dry.eligible,2);assert.equal(calls.length,before);assert.equal(sqlite.prepare('SELECT count(*) AS n FROM telegram_deliveries').get().n,0);
assert.equal((await dispatchTelegram(env,{now:new Date('2026-10-25T21:59:00Z'),fetcher})).status,'outside_delivery_window');
const result=await dispatchTelegram(env,{now:new Date('2026-10-25T22:00:00Z'),fetcher});assert.equal(result.accepted,2);
assert.equal((await dispatchTelegram(env,{now:new Date('2026-10-25T22:02:00Z'),fetcher})).skipped,2);
const reminders=calls.filter(c=>c.method==='sendMessage'&&c.body.text.startsWith('Ma collecte · Demain'));
assert.equal(reminders.length,2);assert(reminders.find(c=>c.body.chat_id==='101').body.text.includes('Recyclage'));
assert(!reminders.find(c=>c.body.chat_id==='202').body.text.includes('Recyclage'));
assert(reminders.every(c=>c.body.text.includes('/stop')&&!c.body.text.includes(address.address)));
// Reconnecting the same account updates preferences without changing its id
// or allowing another reminder for an already-claimed collection date.
const changed=await createTelegramLink(env,'owner',{...input,types:['garbage']},address,new Date('2026-10-25T22:03:00Z'));
updates=[start(6,101,changed)];await syncTelegram(env,{now:new Date('2026-10-25T22:03:00Z'),fetcher});
assert.equal((await telegramStatus(env,'owner',changed.id)).linkConnected,true);
assert.equal((await dispatchTelegram(env,{now:new Date('2026-10-25T22:04:00Z'),fetcher})).skipped,2);
// Winter time and uncertain delivery: never retry a possibly accepted send.
let networkFails=true;
const uncertain=async(url,options)=>{if(url.endsWith('/sendMessage')&&networkFails)throw Error('network timeout');return fetcher(url,options);};
const winter=new Date('2026-11-08T23:00:00Z');assert.equal((await dispatchTelegram(env,{now:winter,fetcher:uncertain})).uncertain,2);
networkFails=false;assert.equal((await dispatchTelegram(env,{now:winter,fetcher:uncertain})).skipped,2);
// /stop is drained before reading recipients, so they receive no next reminder.
updates=[{update_id:7,message:{chat:{id:101,type:'private'},from:{id:101},text:'/stop'}}];
const stopped=await dispatchTelegram(env,{now:new Date('2026-11-22T23:00:00Z'),fetcher});assert.equal(stopped.accepted,1);
assert.equal((await telegramStatus(env,'owner')).recipients.length,1);
assert(!sqlite.prepare('SELECT key FROM telegram_state WHERE key=?').get('test:'+recipients[0].id));
// A blocked bot removes that user's subscription without affecting others.
updates=[{update_id:8,my_chat_member:{chat:{id:202,type:'private'},new_chat_member:{status:'kicked'}}}];
await syncTelegram(env,{now,fetcher});assert.equal((await telegramStatus(env,'owner')).recipients.length,0);
const expired=await createTelegramLink(env,'owner',input,address,now);updates=[start(9,303,expired)];
await syncTelegram(env,{now:new Date(now.getTime()+21*60000),fetcher});assert.equal((await telegramStatus(env,'owner')).recipients.length,0);
assert(!sqlite.prepare('SELECT id FROM telegram_invites WHERE id=?').get(expired.id));
const removable=await createTelegramLink(env,'owner',input,address,now);
await removeTelegramRecipient(env,'other',removable.id);assert(sqlite.prepare('SELECT id FROM telegram_invites WHERE id=?').get(removable.id));
await removeTelegramRecipient(env,'owner',removable.id);assert(!sqlite.prepare('SELECT id FROM telegram_invites WHERE id=?').get(removable.id));
assert.equal((await dispatchTelegram(env,{now:new Date('2027-01-01T23:00:00Z'),fetcher})).status,'calendar_ended');
console.log('Telegram checks passed: one-time links, private-chat ownership, expiry, family subscriptions, owner isolation, tests, dry runs, summer/winter 18:00 reminders, duplicate/uncertain delivery protection, /stop and blocked users. Provider calls mocked.');

// The family cap is enforced by the insertion statement, including simultaneous links.
const attempts=await Promise.allSettled(Array.from({length:12},()=>createTelegramLink(env,'capacity-owner',input,address,now)));
assert.equal(attempts.filter(r=>r.status==='fulfilled').length,10);
assert(attempts.filter(r=>r.status==='rejected').every(r=>r.reason.code==='family_limit'));
assert.equal(sqlite.prepare('SELECT count(*) AS n FROM telegram_invites WHERE owner_id=?').get('capacity-owner').n,10);
// A bounded invocation stops before processing and resumes from its saved offset.
updates=[{update_id:10,message:{chat:{id:404,type:'private'},from:{id:404},text:'/status'}}];
let clockCalls=0;
const budget=await syncTelegram(env,{now,fetcher,clock:()=>clockCalls++===0?0:45000});
assert.equal(budget.status,'backlog');assert.equal(budget.processed,0);
assert.equal(sqlite.prepare("SELECT value FROM telegram_state WHERE key='offset'").get().value,'10');
assert.equal((await syncTelegram(env,{now,fetcher,clock:()=>0})).processed,1);
// An old worker must stop when another worker owns the lease.
updates=[{update_id:11,message:{chat:{id:404,type:'private'},from:{id:404},text:'/status'}}];
const takeover=async(url,options)=>{
 const response=await fetcher(url,options);
 if(url.endsWith('/getUpdates'))sqlite.prepare("UPDATE telegram_state SET value='other-worker' WHERE key='sync_lease'").run();
 return response;
};
assert.equal((await syncTelegram(env,{now,fetcher:takeover})).status,'busy');
assert.equal(sqlite.prepare("SELECT value FROM telegram_state WHERE key='offset'").get().value,'11');
assert.equal(sqlite.prepare("SELECT value FROM telegram_state WHERE key='sync_lease'").get().value,'other-worker');
sqlite.prepare("DELETE FROM telegram_state WHERE key='sync_lease'").run();
console.log('Concurrency checks passed: atomic family limit, bounded polling, resumable offset and lease ownership.');

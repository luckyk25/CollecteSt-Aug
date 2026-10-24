import {TIME_ZONE,MINUTE_MS,HOUR_MS,REMINDERS,reminderMinutes} from '../public/config.mjs';
const localClock=new Intl.DateTimeFormat('en-CA',{timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function parts(ms){return Object.fromEntries(localClock.formatToParts(new Date(ms)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));}
function offsetAt(ms){const p=parts(ms);return Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute)-Math.floor(ms/MINUTE_MS)*MINUTE_MS;}
let cachedDate='',instants=new Map();
export function reminderInstant(date,time){
 if(cachedDate!==date){cachedDate=date;instants.clear();}
 if(instants.has(time))return instants.get(time);
 const minutes=reminderMinutes(time),midnight=Date.parse(date+'T00:00:00Z'),wallTime=midnight+minutes*MINUTE_MS;
 const offsets=new Set([offsetAt(midnight),offsetAt(midnight+12*HOUR_MS),offsetAt(midnight+24*HOUR_MS)]);
 const candidates=[...offsets].map(offset=>wallTime-offset).sort((a,b)=>a-b);
 const [year,month,day]=date.split('-').map(Number);
 const sameDay=p=>p.year===year&&p.month===month&&p.day===day;
 const exact=candidates.filter(ms=>{const p=parts(ms);return sameDay(p)&&p.hour*60+p.minute===minutes;});
 // Repeated autumn times use the first occurrence. A missing spring time
 // moves forward by the clock change (02:30 becomes 03:30).
 const result=exact[0]??candidates.find(ms=>{const p=parts(ms);return sameDay(p)&&p.hour*60+p.minute>minutes;});
 if(result===undefined)throw new Error('Could not resolve reminder time.');
 instants.set(time,result);return result;
}
export function reminderDue(date,time,now){const elapsed=now.getTime()-reminderInstant(date,time);return elapsed>=0&&elapsed<REMINDERS.deliveryWindowMinutes*MINUTE_MS;}

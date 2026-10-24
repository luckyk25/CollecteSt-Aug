import assert from 'node:assert/strict';
import {eventsForSector,upcomingEvents,todayInQuebec,hourInQuebec,icsForEvents} from './public/schedule.mjs';
for(let sector=1;sector<=4;sector++){
 const events=eventsForSector(sector);
 assert.equal(events.length,sector===4?85:83);
 assert.equal(events.filter(e=>e.type==='garbage').length,sector===4?41:40);
 assert.equal(events.filter(e=>e.type==='recycling').length,sector===4?31:30);
 for(const e of events){assert(e.date.startsWith('2026-'));const day=new Date(e.date+'T12:00:00Z').getUTCDay();assert.equal(day,e.type==='bulky'?3:e.date==='2026-01-02'?5:sector);}
 assert.equal(new Set(events.map(e=>e.type+e.date)).size,events.length);
 assert.equal(events.filter(e=>e.type==='green').length,6);
 assert.equal(events.filter(e=>e.type==='bulky').length,7);
}
const monday=eventsForSector(1), has=(type,date)=>monday.some(e=>e.type===type&&e.date===date);
assert(has('recycling','2026-02-23'));assert(has('recycling','2026-03-02'));assert(!has('recycling','2026-03-09'));assert(has('recycling','2026-03-16'));
assert(!has('garbage','2026-04-06'));assert(has('garbage','2026-04-13'));assert(has('garbage','2026-04-20'));assert(has('garbage','2026-10-12'));assert(!has('garbage','2026-10-19'));assert(has('garbage','2026-10-26'));assert(has('garbage','2026-12-28'));
assert(!has('recycling','2026-12-28'));assert(has('green','2026-11-02'));assert(has('bulky','2026-11-04'));
const jan2=eventsForSector(4).filter(e=>e.date==='2026-01-02');assert.equal(jan2.length,2);
assert.equal(todayInQuebec(new Date('2026-10-21T02:00:00Z')),'2026-10-20');assert.equal(hourInQuebec(new Date('2026-10-21T02:00:00Z')),22);
assert(upcomingEvents(monday,new Date('2026-10-26T22:59:00Z')).some(e=>e.date==='2026-10-26'));
assert(!upcomingEvents(monday,new Date('2026-10-26T23:00:00Z')).some(e=>e.date==='2026-10-26'));
assert.equal(upcomingEvents(monday,new Date('2027-01-01T12:00:00Z')).length,0);
assert.deepEqual(eventsForSector(0),[]);
const ics=icsForEvents(monday,'123 rue Exemple');assert(ics.includes('BEGIN:VCALENDAR\r\nVERSION:2.0'));assert(ics.includes('TRIGGER:-PT360M'));assert(ics.includes('DTEND;VALUE=DATE:20261229'));assert(ics.includes('123 rue Exemple'));assert.equal((ics.match(/BEGIN:VEVENT/g)||[]).length,monday.length);for(const line of ics.split('\r\n'))assert(Buffer.byteLength(line)<=75);
console.log('Schedule checks passed: all sectors, season changes, holidays, timezone boundaries, 2026 cutoff and calendar export.');

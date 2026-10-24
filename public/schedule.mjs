import {TIME_ZONE,LOCALE,DAY_MS,COLLECTION_HOURS,REMINDERS,reminderMinutes} from './config.mjs';
export const YEAR = 2026;
export const SOURCES = {
 city: 'https://vsad.ca/matieresresiduelles',
 calendar: 'https://vsad.ca/uploads/communication/2026/Collectes_des_matieres_residuelles_2026.pdf',
 recycling: 'https://www.eeq.ca/vsad',
 recyclingCalendar: 'https://www.eeq.ca/assets/pdf/33849_EEQ_CalendrierCollecte_VSAD_2026-FR.pdf',
 sectors: 'https://www.eeq.ca/assets/pdf/33849_EEQ_CarteCollecte_VSAD_2026-FR.pdf',
 registration: 'https://citoyen.vsad.ca/reclamations'
};
export const TYPES = {
 garbage: {label:'Ordures', short:'Bac noir', class:'garbage', icon:'bin'},
 recycling: {label:'Recyclage', short:'Bac bleu', class:'recycling', icon:'recycle'},
 green: {label:'Résidus verts', short:'Sacs de papier', class:'green', icon:'leaf'},
 bulky: {label:'Encombrants', short:'Sur inscription', class:'bulky', icon:'sofa'}
};
export function addDays(iso, days) { const d=new Date(iso+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+days); return d.toISOString().slice(0,10); }
export function dayDiff(a,b) { return Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/DAY_MS); }
const dateClock=new Intl.DateTimeFormat('en-CA',{timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'});
const hourClock=new Intl.DateTimeFormat('en-CA',{timeZone:TIME_ZONE,hour:'numeric',hourCycle:'h23'});
export function todayInQuebec(now=new Date()) { const parts=dateClock.formatToParts(now); return ['year','month','day'].map(k=>parts.find(x=>x.type===k).value).join('-'); }
export function hourInQuebec(now=new Date()) { return Number(hourClock.format(now)); }
export function formatDate(iso, options={weekday:'long',day:'numeric',month:'long'}) {return new Intl.DateTimeFormat(LOCALE,{timeZone:'UTC',...options}).format(new Date(iso+'T12:00:00Z'));}
// Dates transcribed from the illustrated municipal calendar. No extrapolation beyond 2026.
const garbageWeeks=['2026-01-05','2026-01-19','2026-02-02','2026-02-16','2026-03-02','2026-03-16','2026-03-30','2026-04-13'];
for(let d='2026-04-20'; d<='2026-10-12'; d=addDays(d,7)) garbageWeeks.push(d);
garbageWeeks.push('2026-10-26','2026-11-09','2026-11-23','2026-12-07','2026-12-21','2026-12-28');
const recyclingWeeks=[];
for(let d='2026-01-05'; d<='2026-02-23'; d=addDays(d,7)) recyclingWeeks.push(d);
for(let d='2026-03-02'; d<='2026-12-21'; d=addDays(d,14)) recyclingWeeks.push(d);
const greenWeeks=['2026-04-27','2026-05-11','2026-10-12','2026-10-26','2026-11-02','2026-11-09'];
const bulkyDates=['2026-02-04','2026-05-06','2026-06-03','2026-07-08','2026-08-05','2026-09-02','2026-11-04'];
export function eventsForSector(sector) {
 if(!Number.isInteger(sector)||sector<1||sector>4) return [];
 const out=[];
 for(const [type,weeks] of [['garbage',garbageWeeks],['recycling',recyclingWeeks],['green',greenWeeks]])
  for(const monday of weeks) out.push({type,date:addDays(monday,sector-1)});
 // Jour de l'an : la collecte du jeudi 1er janvier est reportée au vendredi 2.
 if(sector===4) for(const type of ['garbage','recycling'])out.push({type,date:'2026-01-02',note:'Collecte du 1er janvier reportée au 2 janvier.'});
 for(const date of bulkyDates)out.push({type:'bulky',date,deadline:addDays(date,-2)});
 return out.sort((a,b)=>a.date.localeCompare(b.date)||Object.keys(TYPES).indexOf(a.type)-Object.keys(TYPES).indexOf(b.type));
}
export function upcomingEvents(events,now=new Date()) {const today=todayInQuebec(now),hour=hourInQuebec(now);return events.filter(e=>e.date>today||(e.date===today&&hour<COLLECTION_HOURS.end));}
export function icsForEvents(events, address='',now=new Date()) {
 const stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z');
 const escape=s=>String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
 let lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Ma collecte//Saint-Augustin-de-Desmaures//FR','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Ma collecte — Saint-Augustin'];
 for(const e of events) {
  const label=TYPES[e.type].label;
  const description=e.type==='bulky'?'Inscription obligatoire auprès de la Ville avant le lundi précédent à midi. Vérifiez votre inscription.':'Sortez votre bac ou vos sacs avant 7 h. Collecte prévue entre 7 h et 19 h. L’heure de passage du camion n’est pas publiée.';
  lines.push('BEGIN:VEVENT',`UID:collecte-${e.type}-${e.date}-${escape(address.replace(/[^a-z0-9]/gi,''))}@ma-collecte`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${e.date.replaceAll('-','')}`,`DTEND;VALUE=DATE:${addDays(e.date,1).replaceAll('-','')}`,`SUMMARY:${escape(label+' · Ma collecte')}`,`LOCATION:${escape(address+', Saint-Augustin-de-Desmaures')}`,`DESCRIPTION:${escape(description+' Source : '+SOURCES.city)}`);
  lines.push('BEGIN:VALARM',`TRIGGER:-PT${24*60-reminderMinutes(REMINDERS.defaultTime)}M`,'ACTION:DISPLAY',`DESCRIPTION:${escape(e.type==='bulky'?'Encombrants demain : vérifiez votre inscription.':'Collecte demain : préparez vos bacs.')}`,'END:VALARM','END:VEVENT');
 }
 lines.push('END:VCALENDAR');
 // RFC 5545: fold by UTF-8 octets, retaining the full French text.
 return lines.map(line=>{let out='',len=0;for(const ch of line){const n=new TextEncoder().encode(ch).length;if(len+n>74){out+='\r\n ';len=1;}out+=ch;len+=n;}return out;}).join('\r\n')+'\r\n';
}

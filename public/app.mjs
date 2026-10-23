import {collectionIcon as icon,collectionIllustration as illustration} from './visuals.mjs';
import {updateTelegramAddress,loadTelegram,openTelegram} from './telegram.mjs';
import {YEAR,TYPES,eventsForSector,upcomingEvents,todayInQuebec,hourInQuebec,formatDate,dayDiff,addDays,icsForEvents} from './schedule.mjs';
const $=id=>document.getElementById(id);
const days=['Lundi','Mardi','Mercredi','Jeudi'];
const STORAGE='ma-collecte-vsad-v2';
let state={address:'Rue du Vitrier',sector:null};
let storageAvailable=true;
try {const saved=JSON.parse(localStorage.getItem(STORAGE)||localStorage.getItem('ma-collecte-vsad-v1'));if(saved&&typeof saved.address==='string'&&saved.address.trim().length>=3&&saved.address.length<=160)state={address:saved.address,sector:saved.method==='manual_confirmation'&&[1,2,3,4].includes(saved.sector)?saved.sector:null,streetId:saved.streetId,method:saved.method};} catch {storageAvailable=false;}
let pendingAddress=null;
let lookupRequestId=0;

const today=todayInQuebec();
let month=today.startsWith(String(YEAR))?Number(today.slice(5,7))-1:today<String(YEAR)?0:11;
let selectedDate=today.startsWith(String(YEAR))?today:`${YEAR}-${String(month+1).padStart(2,'0')}-01`;
let activeFilters=new Set(Object.keys(TYPES));
let events=[],upcoming=[];
$('address').value=state.address;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function relative(date){const diff=dayDiff(today,date);return diff===0?'Aujourd’hui':diff===1?'Demain':`Dans ${diff} jours`;}
function renderOverview(){
 const hero=$('overview');
 if(!state.sector){hero.innerHTML=`<div class="hero-content"><p class="eyebrow">VOTRE PETIT RITUEL, SIMPLIFIÉ</p><h2>Et si on n’oubliait<br>plus jamais le bac ?</h2><p>Entrez votre adresse : votre secteur et les prochains bacs à sortir sont recherchés automatiquement.</p><button id="choose-sector" class="button">Trouver mon secteur <span aria-hidden="true">→</span></button><div class="hero-bottom"><span>4 secteurs</span><span>Un calendrier pour votre adresse</span></div></div>${illustration()}`;$('choose-sector').addEventListener('click',searchAddress);return;}
 if(today>'2026-12-31'){hero.innerHTML=`<div class="hero-content"><p class="eyebrow">LE CALENDRIER 2026 EST TERMINÉ</p><h2>Une nouvelle année.<br>De nouvelles dates.</h2><p>Les dates 2027 ne sont pas encore intégrées à cette application. Consultez le calendrier de la Ville avant de sortir votre bac.</p><a class="button" href="https://vsad.ca/matieresresiduelles" target="_blank" rel="noopener noreferrer">Consulter la Ville ↗</a></div>${illustration()}`;return;}
 const first=upcoming[0];
 if(!first){hero.innerHTML=`<div class="hero-content"><p class="eyebrow">FIN DU CALENDRIER DISPONIBLE</p><h2>Toutes les dates 2026<br>sont derrière vous.</h2><p>Consultez la Ville pour le prochain calendrier. Aucune date n’est déduite pour 2027.</p><a class="button" href="https://vsad.ca/matieresresiduelles" target="_blank" rel="noopener noreferrer">Consulter la Ville ↗</a></div>${illustration()}`;return;}
 const next=upcoming.filter(e=>e.date===first.date);
 const garbage=next.some(e=>e.type==='garbage'),blue=next.some(e=>e.type==='recycling'),leaves=next.some(e=>e.type==='green');
 const prep=first.type==='bulky'?'Encombrants sur inscription. Vérifiez votre réservation auprès de la Ville.':[garbage?'le bac noir':null,blue?'le bac bleu':null,leaves?'les sacs de papier':null].filter(Boolean).join(', ').replace(/, ([^,]*)$/,' et $1');
 const dateLabel=formatDate(first.date);
 const isToday=first.date===today;
 hero.innerHTML=`<div class="hero-content"><p class="eyebrow">${isToday?'COLLECTE PRÉVUE AUJOURD’HUI':'PROCHAINE COLLECTE'} <span class="hero-count">${relative(first.date)}</span></p><h2 class="hero-date">${escape(dateLabel.charAt(0).toUpperCase()+dateLabel.slice(1))}</h2><div class="hero-tags">${next.map(e=>`<span class="hero-tag">${TYPES[e.type].label}</span>`).join('')}</div><p>${first.type==='bulky'?prep:`${isToday?'À prévoir':'À sortir'} : ${prep}.`}</p><div class="hero-bottom"><span>◷ Avant 7 h</span><span>Collecte de 7 h à 19 h</span></div><p class="tiny">${isToday?'Passage prévu · Le ramassage n’est pas suivi en direct.':'L’heure exacte du camion n’est pas publiée.'}</p></div>${illustration()}`;
}
function renderCards(){
 $('collection-cards').innerHTML=['garbage','recycling','green'].map(type=>{const e=upcoming.find(e=>e.type===type);const t=TYPES[type];return `<article class="collection-card ${type}"><div class="card-top"><span class="type-icon">${icon(type)}</span>${t.label}</div><span class="card-arrow" aria-hidden="true">↗</span><p class="card-date ${!e?'empty':''}">${!state.sector?'Votre adresse ?':e?formatDate(e.date,{day:'numeric',month:'long'}):'Fin du calendrier'}</p><p class="card-subtitle">${!state.sector?'Secteur recherché automatiquement':e?`${days[state.sector-1]} · ${t.short}`:'Aucune autre date en 2026'}</p></article>`;}).join('');
}
function renderCalendar(){
 $('month-title').textContent=new Intl.DateTimeFormat('fr-CA',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(YEAR,month,1)));
 $('prev-month').disabled=month===0;$('next-month').disabled=month===11;
 const first=new Date(Date.UTC(YEAR,month,1));const offset=(first.getUTCDay()+6)%7;
 const start=addDays(`${YEAR}-${String(month+1).padStart(2,'0')}-01`,-offset);
 const count=Math.ceil((offset+new Date(Date.UTC(YEAR,month+1,0)).getUTCDate())/7)*7;
 $('calendar-grid').innerHTML=Array.from({length:count},(_,i)=>{const d=addDays(start,i);const inMonth=Number(d.slice(5,7))===month+1;const ev=events.filter(e=>e.date===d&&activeFilters.has(e.type));const labels=ev.map(e=>TYPES[e.type].label).join(', ');return `<button class="calendar-cell${inMonth?'':' outside'}${d===today?' today':''}${d===selectedDate?' selected':''}" data-date="${d}" aria-label="${escape(formatDate(d))}${labels?': '+labels:''}${d===today?', aujourd’hui':''}" aria-pressed="${d===selectedDate}"><span class="day-number">${Number(d.slice(8,10))}</span><span class="dots">${ev.map(e=>`<i class="dot ${e.type}" aria-hidden="true"></i>`).join('')}</span></button>`;}).join('');
 document.querySelectorAll('[data-date]').forEach(button=>button.addEventListener('click',()=>{const date=button.dataset.date;selectedDate=date;if(date.startsWith(String(YEAR)))month=Number(date.slice(5,7))-1;renderCalendar();}));
 const ev=events.filter(e=>e.date===selectedDate&&activeFilters.has(e.type));
 $('day-details').innerHTML=!state.sector?'Recherchez votre adresse pour afficher les jours de collecte.':`<strong>${escape(formatDate(selectedDate))}</strong>${ev.length?'<br>'+ev.map(e=>`<span class="detail-pill"><i class="dot ${e.type}"></i>${TYPES[e.type].label}${e.type==='bulky'?` · Inscription avant le ${formatDate(e.deadline,{day:'numeric',month:'long'})} à midi`:' · Avant 7 h'}</span>`).join(''):today>'2026-12-31'&&selectedDate>'2026-12-31'?' · Calendrier 2027 non intégré.':' · Aucune collecte avec les filtres sélectionnés.'}`;
}
function renderFilters(){
 $('filters').innerHTML=Object.entries(TYPES).map(([k,t])=>`<button class="filter" data-filter="${k}" aria-pressed="${activeFilters.has(k)}"><i class="dot ${k}"></i>${t.label}</button>`).join('');
 document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{const type=button.dataset.filter;activeFilters.has(type)?activeFilters.delete(type):activeFilters.add(type);renderFilters();renderCalendar();}));
}
function renderUpcoming(){
 if(!state.sector){$('upcoming-list').innerHTML='<p class="empty-upcoming">Recherchez votre adresse : les prochaines dates apparaîtront ici.</p>';$('upcoming-count').textContent='';return;}
 const dates=[...new Set(upcoming.map(e=>e.date))].slice(0,6);
 $('upcoming-count').textContent=dates.length?`${dates.length} prochaines dates`:'';
 if(!dates.length){$('upcoming-list').innerHTML='<p class="empty-upcoming">Toutes les dates disponibles se terminent en 2026. Consultez la Ville pour le calendrier de l’année suivante.</p>';return;}
 $('upcoming-list').innerHTML=dates.map(d=>{const group=upcoming.filter(e=>e.date===d),bulky=group.find(e=>e.type==='bulky');return `<div class="upcoming-row"><div class="date-box">${Number(d.slice(8,10))}<small>${formatDate(d,{month:'short'}).replace('.','')}</small></div><div class="row-day">${formatDate(d,{weekday:'long'}).replace(/^./,c=>c.toUpperCase())}<small>${relative(d)}</small></div><div class="row-types">${group.map(e=>`<span class="row-type"><i class="dot ${e.type}"></i>${TYPES[e.type].label}</span>`).join('')}${bulky?`<span class="small muted">Inscription avant le ${formatDate(bulky.deadline,{day:'numeric',month:'long'})} à midi</span>`:''}</div>${bulky?'<a class="row-action" href="https://vsad.ca/matieresresiduelles" target="_blank" rel="noopener noreferrer">S’inscrire ↗</a>':`<button class="text-button row-action" data-export-date="${d}" aria-label="Ajouter la collecte du ${escape(formatDate(d))} à mon calendrier">Rappel ↓</button>`}</div>`;}).join('');
 document.querySelectorAll('[data-export-date]').forEach(button=>button.addEventListener('click',()=>download(upcoming.filter(e=>e.date===button.dataset.exportDate))));
}
function render(){
 events=eventsForSector(state.sector);upcoming=upcomingEvents(events);
 $('selection-bar').hidden=!state.sector;
 $('selected-address').textContent=state.address;
 $('sector-label').textContent=state.sector?`Secteur ${state.sector} · ${days[state.sector-1]} · ${state.method==='manual_confirmation'?'Confirmé par vous':'Estimation automatique'}`:'';
 updateTelegramAddress(state);
 $('export-calendar').disabled=!state.sector||!upcoming.length;
 $('forget-address').hidden=!state.sector;
 renderOverview();renderCards();renderCalendar();renderUpcoming();
}
function saveAddress(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch{storageAvailable=false;}}
function openDialog(result=null){
 const address=result||state;
 if(!address.streetId){searchAddress();return;}
 pendingAddress=address;
 $('dialog-address').textContent=address.address+' · Saint-Augustin-de-Desmaures';
 document.querySelectorAll('input[name="sector"]').forEach(r=>{r.checked=Number(r.value)===address.sector;});
 $('sector-dialog').showModal();
}
async function searchAddress(){
 const input=$('address'),button=$('address-form').querySelector('button[type="submit"]');
 const query=input.value.trim(),requestId=++lookupRequestId;
 if(!input.checkValidity()){input.reportValidity();return false;}
 button.disabled=true;button.setAttribute('aria-busy','true');$('address-help').classList.remove('error');$('address-help').textContent='Recherche de votre adresse et de votre secteur…';
 document.querySelector('.address-suggestions')?.remove();
 try{
  const response=await fetch('/api/address?q='+encodeURIComponent(query),{cache:'no-store'}),result=await response.json();
  if(requestId!==lookupRequestId||input.value.trim()!==query)return false;
  if(!response.ok)throw new Error(result.error||'La recherche est indisponible. Réessayez plus tard.');
  if((result.status==='matched'||result.status==='needs_confirmation')&&state.method==='manual_confirmation'&&state.address===result.address&&state.streetId===result.streetId&&state.sector){render();$('address-help').textContent='Votre secteur a été confirmé par vous. Vous pouvez le vérifier à tout moment.';return true;}
  if(result.status==='matched'){
   state={address:result.address,sector:result.sector,streetId:result.streetId,method:'map_estimate'};input.value=state.address;saveAddress();render();
   $('address-help').textContent='Secteur estimé automatiquement selon la carte 2026. Vous pouvez le vérifier à tout moment.';return true;
  }
  if(result.status==='needs_confirmation'){$('address-help').textContent=result.error||result.message;openDialog(result);return false;}
  $('address-help').classList.add('error');$('address-help').textContent=result.error||'Précisez votre adresse.';
  if(result.suggestions?.length){const box=document.createElement('div');box.className='address-suggestions';for(const label of result.suggestions){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{input.value=label;searchAddress();});box.append(b);}$('address-form').append(box);}
  input.focus();return false;
 }catch(error){$('address-help').classList.add('error');$('address-help').textContent=error.message;return false;}finally{if(requestId===lookupRequestId){button.disabled=false;button.removeAttribute('aria-busy');}}
}
$('address-form').addEventListener('submit',e=>{e.preventDefault();searchAddress();});
$('change-sector').addEventListener('click',()=>openDialog());
$('close-dialog').addEventListener('click',()=>$('sector-dialog').close());
$('sector-dialog').addEventListener('click',e=>{if(e.target===$('sector-dialog')){const r=$('sector-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('sector-dialog').close();}});
$('sector-form').addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.target);state={address:pendingAddress.address,streetId:pendingAddress.streetId,sector:Number(data.get('sector')),method:'manual_confirmation'};$('address').value=state.address;saveAddress();$('sector-dialog').close();render();$('address-help').textContent='Le secteur près de la limite a été confirmé par vous.';});
$('open-telegram').addEventListener('click',async()=>{if(!state.sector||!state.streetId||$('address').value.trim()!==state.address){if(!await searchAddress())return;}openTelegram();});
$('prev-month').addEventListener('click',()=>{if(month>0){month--;selectedDate=`${YEAR}-${String(month+1).padStart(2,'0')}-01`;renderCalendar();}});
$('next-month').addEventListener('click',()=>{if(month<11){month++;selectedDate=`${YEAR}-${String(month+1).padStart(2,'0')}-01`;renderCalendar();}});
$('today-button').addEventListener('click',()=>{month=today.startsWith(String(YEAR))?Number(today.slice(5,7))-1:today<String(YEAR)?0:11;selectedDate=today.startsWith(String(YEAR))?today:`${YEAR}-${String(month+1).padStart(2,'0')}-01`;renderCalendar();});
function download(items){
 if(!items.length)return;
 const blob=new Blob([icsForEvents(items,state.address)],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=`ma-collecte-secteur-${state.sector}-2026.ics`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 $('export-status').textContent=`${items.length} collectes exportées. Ouvrez le fichier dans votre application de calendrier.`;
}
$('export-calendar').addEventListener('click',()=>download(upcoming));
$('forget-address').addEventListener('click',()=>{try{localStorage.removeItem(STORAGE);localStorage.removeItem('ma-collecte-vsad-v1');}catch{}state={address:'Rue du Vitrier',sector:null};$('address').value=state.address;$('export-status').textContent='';render();$('address-help').textContent='Votre adresse enregistrée a été effacée. Confirmez votre secteur pour recommencer.';});
renderFilters();render();loadTelegram();searchAddress();
// Refresh when the tab regains focus and across Québec midnight / end of collection hours.
let lastTimeKey=todayInQuebec()+':'+hourInQuebec();
function refreshIfNeeded(){const key=todayInQuebec()+':'+hourInQuebec();if(key!==lastTimeKey){lastTimeKey=key;location.reload();}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshIfNeeded();});
setInterval(refreshIfNeeded,60000);

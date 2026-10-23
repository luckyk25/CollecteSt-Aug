const $=id=>document.getElementById(id);
let config={ready:false,subscription:{active:false}},challengeId=null;
export let smsContext=null;
export function updateSmsAddress(state){smsContext=state;}
async function api(path,options={}){const res=await fetch('/api/sms/'+path,{...options,headers:{'Content-Type':'application/json',...options.headers}});let data;try{data=await res.json();}catch{throw new Error('Le service de rappels est indisponible. Réessayez plus tard.');}if(!res.ok)throw new Error(data.error||'Le service de rappels est indisponible.');return data;}
function feedback(text,error=false){$('sms-feedback').textContent=text;$('sms-feedback').classList.toggle('error',error);}
function showStatus(){
 const active=config.subscription?.active;
 $('sms-service-status').textContent=active?'Rappels activés pour '+config.subscription.phone:config.ready?'Abonnement disponible · Votre numéro sera vérifié.':'Service SMS en préparation · Aucun envoi activé.';
 $('open-sms').firstChild.textContent=active?'Gérer mes rappels SMS ':'M’abonner par SMS ';
 $('sms-unavailable').hidden=config.ready;
 $('sms-form').setAttribute('aria-disabled',String(!config.ready));
 $('sms-form').querySelectorAll('input,button').forEach(el=>el.disabled=!config.ready);
 $('sms-active').replaceChildren();$('sms-active').hidden=!active;
 if(active){const info=document.createElement('p');info.textContent=`Rappels activés pour ${config.subscription.phone} · ${config.subscription.address}. La veille à 18 h, heure du Québec.`;const stop=document.createElement('button');stop.className='text-button';stop.type='button';stop.textContent='Me désabonner et supprimer mon numéro';stop.addEventListener('click',async()=>{stop.disabled=true;try{const result=await api('subscription',{method:'DELETE'});config.subscription={active:false};showStatus();feedback(result.message);}catch(e){stop.disabled=false;feedback(e.message,true);}});$('sms-active').append(info,stop);}
}
export async function loadSms(){try{config=await api('status');showStatus();}catch(e){$('sms-service-status').textContent='Service temporairement indisponible.';feedback(e.message,true);showStatus();}}
export function openSms(){if(!smsContext?.sector||!smsContext?.streetId)return false;$('sms-selected-address').textContent=smsContext.address+` · Secteur ${smsContext.sector}`;$('sms-dialog').showModal();showStatus();return true;}
$('close-sms').addEventListener('click',()=>$('sms-dialog').close());
$('sms-form').addEventListener('submit',async e=>{e.preventDefault();feedback('');const button=$('sms-send-code');button.disabled=true;try{
 const types=[...document.querySelectorAll('input[name="sms-type"]:checked')].map(el=>el.value);
 const data=await api('start',{method:'POST',body:JSON.stringify({phone:$('sms-phone').value,types,consent:$('sms-consent').checked,address:smsContext.address,streetId:smsContext.streetId,confirmedSector:smsContext.method==='manual_confirmation'?smsContext.sector:undefined})});
 challengeId=data.challengeId;$('sms-form').hidden=true;$('sms-verify-form').hidden=false;feedback(data.message);$('sms-code').focus();
 }catch(error){feedback(error.message,true);}finally{button.disabled=!config.ready;}});
$('sms-verify-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.target.querySelector('button[type=submit]');button.disabled=true;try{
 const sub=await api('verify',{method:'POST',body:JSON.stringify({challengeId,code:$('sms-code').value})});config.subscription=sub;$('sms-verify-form').hidden=true;$('sms-form').hidden=false;$('sms-form').reset();$('sms-code').value='';challengeId=null;showStatus();feedback('Votre numéro est vérifié. Vos rappels sont activés pour les collectes sélectionnées.');
 }catch(error){feedback(error.message,true);}finally{button.disabled=false;}});
$('sms-restart').addEventListener('click',()=>{challengeId=null;$('sms-verify-form').hidden=true;$('sms-form').hidden=false;$('sms-code').value='';feedback('Vous pouvez demander un nouveau code après une minute.');});

const $=id=>document.getElementById(id);
let address=null,config={ready:false,recipients:[]},pending=null,polling=false,loaded=false;
export function updateTelegramAddress(value){address=value;}
async function api(path,options={}){
 const response=await fetch('/api/telegram/'+path,{...options,headers:{'Content-Type':'application/json',...options.headers}});
 let data;try{data=await response.json();}catch{throw new Error('Le service Telegram est indisponible. Réessayez plus tard.');}
 if(!response.ok)throw new Error(data.error||'Le service Telegram est indisponible.');return data;
}
function feedback(message,error=false){$('telegram-feedback').textContent=message;$('telegram-feedback').classList.toggle('error',error);}
function render(){
 $('telegram-service-status').textContent=loaded?(config.ready?`${config.recipients.length} compte${config.recipients.length>1?'s':''} connecté${config.recipients.length>1?'s':''} · Gratuit via Telegram`:'Connexion Telegram en préparation · Aucun rappel activé.'):'Vérification du service…';
 $('telegram-unavailable').hidden=!loaded||config.ready;
 $('telegram-form').querySelectorAll('input,button').forEach(el=>el.disabled=!config.ready);
 const list=$('telegram-recipients');list.replaceChildren();
 if(!config.recipients.length)return;
 const heading=document.createElement('h3');heading.textContent='Les comptes de votre famille';list.append(heading);
 for(const recipient of config.recipients){
  const row=document.createElement('article');row.className='telegram-recipient';
  const name=document.createElement('strong');name.textContent=recipient.username?'@'+recipient.username:recipient.name;
  const info=document.createElement('p');info.textContent=`${recipient.address===`Secteur ${recipient.sector}`?recipient.address:`${recipient.address} · Secteur ${recipient.sector}`} · La veille à 18 h`;
  const types=document.createElement('p');const labels={garbage:'Ordures',recycling:'Recyclage',green:'Résidus verts',bulky:'Encombrants'};types.textContent=recipient.types.map(t=>labels[t]).join(' · ');
  const actions=document.createElement('div');actions.className='telegram-actions';
  const test=document.createElement('button');test.type='button';test.className='button secondary';test.textContent='Envoyer un test';test.disabled=!config.ready;
  test.addEventListener('click',async()=>{test.disabled=true;try{const result=await api('test',{method:'POST',body:JSON.stringify({id:recipient.id})});feedback(result.message);}catch(e){feedback(e.message,true);}finally{test.disabled=!config.ready;}});
  const stop=document.createElement('button');stop.type='button';stop.className='text-button';stop.textContent='Désabonner';
  stop.addEventListener('click',async()=>{stop.disabled=true;try{const result=await api('subscription',{method:'DELETE',body:JSON.stringify({id:recipient.id})});config=await api('status');render();feedback(result.message);}catch(e){stop.disabled=false;feedback(e.message,true);}});
  actions.append(test,stop);row.append(name,info,types,actions);list.append(row);
 }
}
export async function loadTelegram(){
 try{config=await api('status');loaded=true;render();}catch(e){loaded=true;render();$('telegram-service-status').textContent='Service temporairement indisponible.';feedback(e.message,true);}
}
async function sync(){
 if(polling||!config.ready)return;
 polling=true;
 try{
  config=await api('status');render();
  if(pending&&(config.connectedInvites||[]).includes(pending.id)){
   pending=null;$('telegram-link-panel').hidden=true;feedback('Telegram est connecté ! Vos rappels sont activés. Vous pouvez connecter un autre membre de la famille.');
  }
 }catch(e){feedback(e.message,true);}finally{polling=false;}
}
export function openTelegram(){
 if(!address?.sector||!address?.streetId)return false;
 $('telegram-selected-address').textContent=address.address+` · Secteur ${address.sector}`;
 $('telegram-dialog').showModal();render();loadTelegram().then(sync);return true;
}
$('close-telegram').addEventListener('click',()=>$('telegram-dialog').close());
$('telegram-form').addEventListener('submit',async event=>{
 event.preventDefault();feedback('');const button=$('telegram-connect');button.disabled=true;
 try{
  if(!address?.sector)throw new Error('Recherchez d’abord votre adresse.');
  if(pending){await api('subscription',{method:'DELETE',body:JSON.stringify({id:pending.id})});pending=null;}
  const types=[...document.querySelectorAll('input[name="telegram-type"]:checked')].map(el=>el.value);
  pending=await api('link',{method:'POST',body:JSON.stringify({types,consent:$('telegram-consent').checked,address:address.address,streetId:address.streetId,confirmedSector:address.method==='manual_confirmation'?address.sector:undefined})});
  $('telegram-open-link').href=pending.url;$('telegram-link-value').value=pending.url;$('telegram-link-panel').hidden=false;
  feedback('Ouvrez ce lien dans Telegram et appuyez sur Démarrer. Pour un proche, copiez le lien et envoyez-le-lui.');
 }catch(e){feedback(e.message,true);}finally{button.disabled=!config.ready;}
});
$('telegram-copy-link').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(pending.url);feedback('Lien copié. Envoyez-le à une seule personne : il est utilisable une fois, pendant 20 minutes.');}
 catch{$('telegram-link-value').focus();$('telegram-link-value').select();feedback('Sélectionnez et copiez ce lien pour le partager.');}
});
$('telegram-refresh').addEventListener('click',sync);
setInterval(()=>{
 if(!pending||!$('telegram-dialog').open||document.hidden)return;
 if(Date.parse(pending.expiresAt)<=Date.now()){
  pending=null;$('telegram-link-panel').hidden=true;feedback('Ce lien a expiré. Créez-en un nouveau pour vous connecter.',true);return;
 }
 sync();
},5000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&$('telegram-dialog').open)sync();});

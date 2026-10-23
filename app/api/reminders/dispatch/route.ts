import {env} from 'cloudflare:workers';
import {json,failure} from '../../../../lib/api.mjs';
import {dispatchTelegram} from '../../../../lib/telegram-core.mjs';
// This shared endpoint relies on the unchanged owner-private Sites service-access boundary.
// It rejects browser identities. Sites' validated service token supplies no visitor identity.
export async function POST(request:Request){
 if(request.headers.has('oai-authenticated-user-id')||request.headers.has('origin'))return json({error:'Accès au service de rappels requis.'},403);
 try{return json(await dispatchTelegram(env,{dryRun:new URL(request.url).searchParams.get('dry_run')==='1'}));}catch(e){return failure(e);}
}

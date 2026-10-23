import {env} from 'cloudflare:workers';
import {json,userId,sameOrigin,body,failure} from '../../../../lib/api.mjs';
import {startChallenge} from '../../../../lib/sms-core.mjs';
import {resolveSelection} from '../../../../lib/addresses.mjs';
export async function POST(request:Request){try{const id=userId(request);sameOrigin(request);const input=await body(request);const address=resolveSelection(input.address,input.streetId,input.confirmedSector);return json(await startChallenge(env,id,input,address));}catch(e){return failure(e);}}

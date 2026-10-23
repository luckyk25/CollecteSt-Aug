import {env} from 'cloudflare:workers';
import {json,userId,sameOrigin,body,failure} from '../../../../lib/api.mjs';
import {createTelegramLink} from '../../../../lib/telegram-core.mjs';
import {resolveSelection} from '../../../../lib/addresses.mjs';
export async function POST(request:Request){try{const owner=userId(request);sameOrigin(request);const input=await body(request);return json(await createTelegramLink(env,owner,input,resolveSelection(input.address,input.streetId,input.confirmedSector)));}catch(e){return failure(e);}}

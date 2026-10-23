import {env} from 'cloudflare:workers';
import {json,userId,sameOrigin,body,failure} from '../../../../lib/api.mjs';
import {verifyChallenge} from '../../../../lib/sms-core.mjs';
export async function POST(request:Request){try{const id=userId(request);sameOrigin(request);return json(await verifyChallenge(env,id,await body(request)));}catch(e){return failure(e);}}

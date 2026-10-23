import {env} from 'cloudflare:workers';
import {json,userId,sameOrigin,failure} from '../../../../lib/api.mjs';
import {readSubscription,unsubscribe} from '../../../../lib/sms-core.mjs';
export async function GET(request:Request){try{return json(await readSubscription(env,userId(request)));}catch(e){return failure(e);}}
export async function DELETE(request:Request){try{const id=userId(request);sameOrigin(request);return json(await unsubscribe(env,id));}catch(e){return failure(e);}}

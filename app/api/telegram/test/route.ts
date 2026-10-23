import {env} from 'cloudflare:workers';
import {json,userId,sameOrigin,body,failure} from '../../../../lib/api.mjs';
import {testTelegramRecipient} from '../../../../lib/telegram-core.mjs';
export async function POST(request:Request){try{const owner=userId(request);sameOrigin(request);const input=await body(request);return json(await testTelegramRecipient(env,owner,String(input.id||'')));}catch(e){return failure(e);}}

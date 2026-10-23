import {env} from 'cloudflare:workers';
import {json,userId,sameOrigin,failure} from '../../../../lib/api.mjs';
import {syncTelegram,telegramStatus} from '../../../../lib/telegram-core.mjs';
export async function POST(request:Request){try{const owner=userId(request);sameOrigin(request);await syncTelegram(env);return json(await telegramStatus(env,owner,new URL(request.url).searchParams.get('invite')||''));}catch(e){return failure(e);}}

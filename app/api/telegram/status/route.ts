import {env} from 'cloudflare:workers';
import {json,userId,failure} from '../../../../lib/api.mjs';
import {telegramStatus} from '../../../../lib/telegram-core.mjs';
export async function GET(request:Request){try{return json(await telegramStatus(env,userId(request)));}catch(e){return failure(e);}}

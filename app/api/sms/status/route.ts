import {env} from 'cloudflare:workers';
import {json,userId,failure} from '../../../../lib/api.mjs';
import {smsReady,readSubscription,CONSENT_TEXT,CONSENT_VERSION} from '../../../../lib/sms-core.mjs';
export async function GET(request:Request){try{const id=userId(request);return json({ready:smsReady(env),consentText:CONSENT_TEXT,consentVersion:CONSENT_VERSION,reminder:'La veille à 18 h · Heure du Québec',subscription:await readSubscription(env,id)});}catch(e){return failure(e);}}

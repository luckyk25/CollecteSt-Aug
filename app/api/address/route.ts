import {json,failure} from '../../../lib/api.mjs';
import {lookupAddress} from '../../../lib/addresses.mjs';
export async function GET(request:Request){try{return json(lookupAddress(new URL(request.url).searchParams.get('q')));}catch(e){return failure(e);}}

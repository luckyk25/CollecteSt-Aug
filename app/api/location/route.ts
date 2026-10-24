import {json,sameOrigin,body,failure} from '../../../lib/api.mjs';
import {lookupLocation} from '../../../lib/addresses.mjs';
export async function POST(request:Request){try{sameOrigin(request);return json(lookupLocation(await body(request)));}catch(error){return failure(error);}}

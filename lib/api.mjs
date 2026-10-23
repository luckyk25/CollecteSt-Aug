import {SmsError} from './sms-core.mjs';
export function json(value,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function userId(request){const id=request.headers.get('oai-authenticated-user-id');if(!id)throw new SmsError(401,'Connectez-vous à ChatGPT pour gérer vos rappels.','unauthorized');return id;}
export function sameOrigin(request){if(request.headers.get('origin')!==new URL(request.url).origin)throw new SmsError(403,'Cette action doit être effectuée depuis l’application.','forbidden');}
const MAX_BODY_BYTES=4096;
export async function body(request){
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))throw new SmsError(415,'Format de demande invalide.');
 const length=request.headers.get('content-length');
 if(length!==null&&Number(length)>MAX_BODY_BYTES)throw new SmsError(413,'La demande est trop longue.');
 const reader=request.body?.getReader();
 const chunks=[];let size=0;
 if(reader)try{
  while(true){
   const {value,done}=await reader.read();if(done)break;
   size+=value.byteLength;
   if(size>MAX_BODY_BYTES){await reader.cancel();throw new SmsError(413,'La demande est trop longue.');}
   chunks.push(value);
  }
 }finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;
 for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 let input;
 try{input=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new SmsError(400,'La demande est invalide.');}
 if(!input||typeof input!=='object'||Array.isArray(input))throw new SmsError(400,'La demande doit être un objet JSON.');
 return input;
}
export function failure(error){if(error instanceof SmsError)return json({error:error.message,code:error.code},error.status);return json({error:'Le service est temporairement indisponible. Réessayez plus tard.',code:'server_error'},503);}

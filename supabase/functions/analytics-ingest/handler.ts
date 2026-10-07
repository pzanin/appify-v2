export interface IngestAdapter {
  projectOrigin(id:string): Promise<string|null>;
  ingest(event:Record<string,string>,origin:string):Promise<boolean>;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const contentId = /^[0-9]{1,20}$/;
export function validEvent(input:unknown): input is Record<string,string> {
  if(!input || typeof input!=='object' || Array.isArray(input)) return false;
  const event=input as Record<string,unknown>;
  const fields=['eventId','projectId','installationId','eventName','moduleId','lessonId','targetKind','targetId'];
  if(Object.keys(event).length!==fields.length || fields.some(field=>typeof event[field]!=='string')) return false;
  if(!['eventId','projectId','installationId'].every(field=>uuid.test(event[field] as string)) || !contentId.test(event.moduleId as string)) return false;
  if(event.eventName==='lesson_open' || event.eventName==='lesson_complete') return contentId.test(event.lessonId as string) && event.targetKind==='' && event.targetId==='';
  if(event.eventName==='link_click') return (event.targetKind==='offer' && event.lessonId==='' || event.targetKind==='material' && contentId.test(event.lessonId as string)) && /^[a-zA-Z0-9._:-]{1,80}$/.test(event.targetId as string);
  return false;
}
async function readBody(request:Request) {
  const reader=request.body?.getReader(); if(!reader) throw new Error();
  let size=0;const chunks:Uint8Array[]=[];
  while(true) {const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2048){await reader.cancel();throw new Error();}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return JSON.parse(new TextDecoder().decode(bytes));
}
export function createIngestHandler(adapter:IngestAdapter) {
  return async (request:Request):Promise<Response> => {
    const origin=request.headers.get('origin') || '';
    const headers = {'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'content-type','Vary':'Origin','Cache-Control':'no-store'};
    if(!/^https:\/\/[a-zA-Z0-9.-]+(?::[0-9]+)?$/.test(origin)) return new Response(null,{status:403});
    if(request.method==='OPTIONS') return new Response(null,{status:204,headers});
    if(request.method!=='POST') return new Response(null,{status:405,headers});
    if(!request.headers.get('content-type')?.startsWith('application/json')) return new Response(null,{status:415,headers});
    let event:unknown;
    try {event=await readBody(request);} catch {return new Response(null,{status:400,headers});}
    if(!validEvent(event)) return new Response(null,{status:400,headers});
    try {
      if(await adapter.projectOrigin(event.projectId)!==origin) return new Response(null,{status:403,headers});
      return new Response(null,{status:await adapter.ingest(event,origin) ? 204 : 429,headers});
    } catch {return new Response(null,{status:503,headers});}
  };
}

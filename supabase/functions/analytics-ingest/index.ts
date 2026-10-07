import { createClient } from 'npm:@supabase/supabase-js@2.105.4';
import { createIngestHandler } from './handler.ts';
// This file runs exclusively inside Supabase; administrative credentials never enter the PWA.
const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(createIngestHandler({
  async projectOrigin(id) {
    const {data,error}=await client.from('appify_analytics_projects').select('allowed_origin,enabled').eq('id',id).single();
    if(error || !data?.enabled) return null;
    return data.allowed_origin;
  },
  async ingest(event,origin) {
    const {data,error}=await client.rpc('appify_analytics_ingest',{p_event:event,p_origin:origin});
    if(error) throw new Error('Ingestion unavailable');
    return data===true;
  }
}));

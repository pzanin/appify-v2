import { createClient } from '@supabase/supabase-js';
import type { PwaConfig } from '../types';
import { analyticsBaseUrl, type AnalyticsReportRow } from '../utils/analytics';
import { containsPrivateCredential } from '../utils/exportSecurity';
export function createAnalyticsClient(config: PwaConfig) {
  const url = analyticsBaseUrl(config.supabaseUrl);
  const key = config.supabaseAnonKey.trim();
  if (!url || !key || containsPrivateCredential(key)) throw new Error('Informe a URL do Supabase e uma chave pública publishable/anon.');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
}
export async function fetchAnalyticsReport(client: ReturnType<typeof createAnalyticsClient>, projectId: string, days: number): Promise<AnalyticsReportRow[]> {
  const {data:project,error:projectError} = await client.from('appify_analytics_projects').select('id').eq('id',projectId).single();
  if (projectError || !project) throw new Error('Projeto não registrado ou sem permissão para consultar.');
  const until = new Date();
  const since = new Date(until.getTime() - Math.min(90,Math.max(1,days)) * 86400000);
  const {data,error} = await client.rpc('appify_analytics_report',{p_project_id:projectId,p_since:since.toISOString(),p_until:until.toISOString()});
  if (error || !Array.isArray(data)) throw new Error('Não foi possível consultar os dados. Confira a configuração do backend.');
  return data;
}

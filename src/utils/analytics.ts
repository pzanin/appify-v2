import type { PwaConfig } from '../types';
export type AnalyticsEventName = 'lesson_open' | 'lesson_complete' | 'link_click';
export interface AnalyticsEvent {
  eventId: string; projectId: string; installationId: string; eventName: AnalyticsEventName;
  moduleId: string; lessonId: string; targetKind: 'offer' | 'material' | ''; targetId: string;
}
export interface AnalyticsReportRow { event_name: AnalyticsEventName; module_id: string; lesson_id: string; target_kind: string; target_id: string; total: number; }
export const isAnalyticsId = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export function analyticsBaseUrl(value: string): string | null {
  try { const url = new URL(value.trim()); return url.protocol === 'https:' && /^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) && !url.username && !url.password && (url.pathname === '/' || url.pathname === '') && !url.search && !url.hash ? url.origin : null; }
  catch { return null; }
}
export function analyticsConfigured(config: PwaConfig): boolean {
  return config.analyticsEnabled === true && isAnalyticsId(config.analyticsProjectId || '') && !!analyticsBaseUrl(config.supabaseUrl);
}
// Anonymous events are interactions, not authenticated people or verified sales.
export async function trackAnalyticsEvent(config: PwaConfig, live: boolean, details: Pick<AnalyticsEvent, 'eventName' | 'moduleId' | 'lessonId'> & Partial<Pick<AnalyticsEvent, 'targetKind' | 'targetId'>>): Promise<void> {
  if (!live || !analyticsConfigured(config)) return;
  try {
    const storageKey = `appify-analytics-installation:${config.analyticsProjectId}`;
    let installationId = localStorage.getItem(storageKey);
    if (!installationId || !isAnalyticsId(installationId)) { installationId = crypto.randomUUID(); localStorage.setItem(storageKey, installationId); }
    const event: AnalyticsEvent = {eventId: crypto.randomUUID(), projectId: config.analyticsProjectId!, installationId, targetKind:'', targetId:'', ...details};
    await fetch(`${analyticsBaseUrl(config.supabaseUrl)}/functions/v1/analytics-ingest`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(event), keepalive:true, signal:AbortSignal.timeout(4000)});
  } catch { /* Analytics must never interrupt the customer's content or navigation. */ }
}
export function summarizeAnalytics(rows: AnalyticsReportRow[]) {
  return rows.reduce((totals,row) => {
    if (row.event_name in totals && Number.isFinite(Number(row.total)) && Number(row.total) >= 0) totals[row.event_name] += Number(row.total);
    return totals;
  }, {lesson_open:0,lesson_complete:0,link_click:0});
}

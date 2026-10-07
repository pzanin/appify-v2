import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { analyticsConfigured, isAnalyticsId, summarizeAnalytics, type AnalyticsReportRow } from '../utils/analytics';
import { createAnalyticsClient, fetchAnalyticsReport } from '../services/analyticsService';
import { normalizePublishedUrl } from '../utils/publication';

export function AnalyticsDashboard() {
  const config = useAppStore(state => state.pwaConfig);
  const modules = useAppStore(state => state.modules);
  const projectId = useAppStore(state => state.currentProjectId);
  const updateConfig = useAppStore(state => state.updatePwaConfig);
  const client = useMemo(() => { try { return createAnalyticsClient(config); } catch { return null; } },[config.supabaseUrl,config.supabaseAnonKey]);
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [signedIn,setSignedIn] = useState(false);
  const [busy,setBusy] = useState(false);
  const [days,setDays] = useState(7);
  const [rows,setRows] = useState<AnalyticsReportRow[] | null>(null);
  const [message,setMessage] = useState('');
  const [updated,setUpdated] = useState('');
  const generation = useRef(0);
  const configured = analyticsConfigured(config);
  useEffect(() => {
    generation.current++; setRows(null); setUpdated(''); setMessage(''); setBusy(false); setSignedIn(false); setPassword('');
    return () => { generation.current++; void client?.auth.signOut({scope:'local'}); };
  },[client,projectId,config.analyticsProjectId]);
  useEffect(() => { generation.current++; setRows(null); setUpdated(''); setMessage(''); setBusy(false); },[days,config.analyticsEnabled]);
  const run = async (operation:()=>Promise<void>) => {
    const current = generation.current;
    setBusy(true);setMessage('');
    try { await operation(); } catch { if (generation.current===current) setMessage('Não foi possível concluir. Confira a conta, as permissões e a configuração do Supabase.'); }
    finally { if (generation.current===current) setBusy(false); }
  };
  const login = async (event:React.FormEvent) => {
    event.preventDefault(); if (!client) return;
    const current = generation.current;
    await run(async()=>{
      const {error} = await client.auth.signInWithPassword({email:email.trim(),password});
      if (generation.current!==current) return;
      setPassword(''); if(error) throw error; setSignedIn(true);setMessage('Acesso aos relatórios autorizado.');
    });
  };
  const refresh = () => {
    if(!client || !signedIn || !configured) return;
    const current = generation.current;
    setRows(null);setUpdated('');
    void run(async()=>{
      const result = await fetchAnalyticsReport(client,config.analyticsProjectId!,days);
      if (generation.current!==current) return;
      setRows(result);setUpdated(new Date().toLocaleString('pt-BR'));
    });
  };
  const register = () => {
    if(!client || !signedIn || !isAnalyticsId(config.analyticsProjectId || '')) return;
    const address = normalizePublishedUrl(config.publishedUrl ?? config.domain ?? '');
    if(!address) {setMessage('Informe o endereço HTTPS real da hospedagem em Publicação → Testar no celular.');return;}
    const current = generation.current;
    void run(async()=>{
      const {data:user,error:authError} = await client.auth.getUser();
      if(authError || !user.user) throw new Error();
      const {error} = await client.from('appify_analytics_projects').upsert({id:config.analyticsProjectId,owner_id:user.user.id,allowed_origin:new URL(address).origin,enabled:true},{onConflict:'id'});
      if(error) throw error;
      if(generation.current===current) setMessage('Projeto registrado. Ative a coleta e reexporte o PWA para começar a receber eventos.');
    });
  };
  const totals = rows ? summarizeAnalytics(rows) : null;
  const metrics = [
    {key:'lesson_open' as const,title:'Aberturas de aulas',hint:'Conta cada entrada na aula; não comprova consumo.'},
    {key:'lesson_complete' as const,title:'Conclusões marcadas',hint:'Uma por aula e instalação; não comprova aprendizado.'},
    {key:'link_click' as const,title:'Cliques em ofertas e materiais',hint:'Botões de checkout dos módulos e materiais do Builder; não representa vendas.'},
  ];
  return <div style={{paddingBottom:60}}>
    <div className="section-header"><div><h2 className="section-title">Analytics</h2><p className="section-sub">Três indicadores de interação do seu produto.</p></div></div>
    <p role="status">{!configured ? 'Coleta não configurada ou desativada.' : !signedIn ? 'Coleta configurada no projeto. Entre para consultar os relatórios.' : rows===null ? 'Relatórios ainda não consultados para este período.' : `Última consulta: ${updated}`}</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',gap:16,margin:'20px 0'}}>
      {metrics.map(metric=><section key={metric.key} className="eng-card" style={{padding:20}}><h3 style={{fontSize:15}}>{metric.title}</h3><strong style={{fontSize:28,margin:'8px 0'}}>{totals ? totals[metric.key].toLocaleString('pt-BR') : '—'}</strong><p style={{fontSize:13,color:'var(--muted)'}}>{metric.hint}</p></section>)}
    </div>
    <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:12,marginBottom:16}}>
      <label htmlFor="analytics-period">Período</label><select id="analytics-period" className="vpb-input" style={{width:'auto'}} value={days} onChange={event=>setDays(Number(event.target.value))}><option value={1}>Últimas 24 horas</option><option value={7}>Últimos 7 dias</option><option value={30}>Últimos 30 dias</option><option value={90}>Últimos 90 dias</option></select>
      <button className="btn-primary" disabled={busy || !signedIn || !configured} onClick={refresh}>{busy ? 'Aguarde…' : 'Atualizar dados'}</button>
    </div>
    {message && <p role="status">{message}</p>}
    {rows && rows.length===0 && <p>Nenhuma interação recebida neste período.</p>}
    {rows && rows.length>0 && <div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left',borderCollapse:'collapse'}}><caption style={{textAlign:'left',marginBottom:12}}>Interações por conteúdo</caption><thead><tr><th>Conteúdo</th><th>Interação</th><th>Total</th></tr></thead><tbody>{rows.map((row,index)=>{
      const mod = modules.find(item=>String(item.id)===row.module_id);
      const lesson = mod?.subs.find(item=>String(item.id)===row.lesson_id);
      return <tr key={index}><td style={{padding:'12px 0'}}>{mod?.name || 'Módulo removido'}{row.lesson_id ? ` / ${lesson?.name || 'Aula removida'}` : ''}{row.target_kind==='material' ? ' / Material' : row.target_kind==='offer' ? ' / Oferta' : ''}</td><td>{metrics.find(metric=>metric.key===row.event_name)?.title}</td><td>{Number(row.total).toLocaleString('pt-BR')}</td></tr>;
    })}</tbody></table></div>}
    <details style={{marginTop:24,border:'1px solid var(--border)',borderRadius:12,padding:20}}><summary style={{cursor:'pointer',fontWeight:700}}>Configurar Supabase e acesso aos relatórios</summary>
      <p>O backend precisa ser instalado uma vez antes de ativar a coleta. Exportar o PWA não instala o banco de dados.</p>
      <label className="vpb-label" htmlFor="analytics-url">URL do projeto Supabase</label><input id="analytics-url" className="vpb-input" value={config.supabaseUrl} placeholder="https://seu-projeto.supabase.co" onChange={event=>updateConfig({supabaseUrl:event.target.value})} />
      <label className="vpb-label" htmlFor="analytics-key">Chave pública publishable / anon</label><input id="analytics-key" className="vpb-input" type="password" autoComplete="off" value={config.supabaseAnonKey} onChange={event=>updateConfig({supabaseAnonKey:event.target.value})} />
      <p style={{fontSize:13,color:'var(--muted)'}}>Use somente a chave pública. Chaves administrativas ficam no backend.</p>
      <label className="vpb-label" htmlFor="analytics-project">Identificador de Analytics deste projeto</label><input id="analytics-project" className="vpb-input" value={config.analyticsProjectId || ''} readOnly />
      {!config.analyticsProjectId && <button className="btn-ghost" onClick={()=>updateConfig({analyticsProjectId:crypto.randomUUID()})}>Criar identificador</button>}
      <label style={{display:'flex',gap:8,margin:'16px 0'}}><input type="checkbox" checked={config.analyticsEnabled===true} onChange={event=>updateConfig({analyticsEnabled:event.target.checked})} />Ativar coleta neste projeto</label>
      <p style={{fontSize:13,color:'var(--muted)'}}>Após configurar ou alterar a coleta, reexporte e atualize o PWA hospedado. Testes no Builder não entram nas métricas. Sem internet, os eventos não são enviados.</p>
      {!signedIn ? <form onSubmit={login} style={{maxWidth:420}}><h3>Acesso do proprietário</h3><p style={{fontSize:13}}>Use sua conta do backend de Analytics. Este acesso não é o login dos compradores.</p><label className="vpb-label" htmlFor="analytics-email">E-mail</label><input id="analytics-email" className="vpb-input" type="email" autoComplete="username" required value={email} onChange={event=>setEmail(event.target.value)} /><label className="vpb-label" htmlFor="analytics-password">Senha</label><input id="analytics-password" className="vpb-input" type="password" autoComplete="current-password" required value={password} onChange={event=>setPassword(event.target.value)} /><button className="btn-primary" style={{marginTop:12}} disabled={busy || !client}>Entrar nos relatórios</button></form> : <div style={{display:'flex',flexWrap:'wrap',gap:12}}><button className="btn-ghost" disabled={busy} onClick={register}>Registrar / atualizar projeto no backend</button><button className="btn-ghost" disabled={busy} onClick={()=>{void run(async()=>{await client?.auth.signOut({scope:'local'});setSignedIn(false);setRows(null);setUpdated('');});}}>Sair dos relatórios</button></div>}
    </details>
  </div>;
}

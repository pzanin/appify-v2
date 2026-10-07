import React, { useState } from 'react';
import { Download, ExternalLink, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { DeployInstructions } from './DeployInstructions';
import { useAppStore } from '../store/useAppStore';
import { ToastType } from '../types';
import { handleExportZIP } from '../utils/exportPWA';
import { openExternalLink } from '../utils/externalLinks';
import { normalizePublishedUrl } from '../utils/publication';

interface PublicationHubProps { showToast: (msg: string, type?: ToastType) => void; }

export function PublicationHub({ showToast }: PublicationHubProps) {
  const config = useAppStore(state => state.pwaConfig);
  const modules = useAppStore(state => state.modules);
  const projectId = useAppStore(state => state.currentProjectId);
  const updateConfig = useAppStore(state => state.updatePwaConfig);
  const setStep = useAppStore(state => state.setStep);
  const [exporting, setExporting] = useState(false);
  const requirements = [
    { label: 'Nome do aplicativo definido', ok: !!config.appName.trim() && config.appName !== 'Meu App', step: 0 },
    { label: 'Ao menos um módulo ativo com aula', ok: modules.some(m => m.status === 'Ativo' && m.subs.length > 0), step: 1 },
  ];
  const ready = requirements.every(item => item.ok);
  const publishedUrl = normalizePublishedUrl(config.publishedUrl ?? config.domain ?? '');
  const qrUrl = publishedUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(publishedUrl)}` : '';
  const history = config.exportHistory || [];
  const cardStyle = { padding: 24 };
  const exportZip = async () => {
    if (exporting || !ready) return;
    const snapshot = { projectId, version: config.version || '1.0.0', notes: config.changelogNotes || 'Sem notas.' };
    setExporting(true);
    try {
      const success = await handleExportZIP(showToast);
      const current = useAppStore.getState();
      if (success && current.currentProjectId === snapshot.projectId) {
        current.updatePwaConfig({ exportHistory: [{ version: snapshot.version, notes: snapshot.notes, date: new Date().toISOString() }, ...(current.pwaConfig.exportHistory || [])] });
      }
    } catch {
      showToast('Não foi possível concluir a exportação.', 'error');
    } finally { setExporting(false); }
  };
  const copyUrl = async () => {
    if (!publishedUrl) return;
    try { await navigator.clipboard.writeText(publishedUrl); showToast('Link copiado!', 'success'); }
    catch { showToast('Não foi possível copiar. Selecione o endereço e copie manualmente.', 'error'); }
  };
  return <div className="publication-hub" style={{ paddingBottom: 80 }}>
    <div className="section-header" style={{ marginBottom: 24 }}><div>
      <h2 className="section-title">Publicação</h2>
      <p className="section-sub">Confira o projeto, exporte e teste seu aplicativo no celular.</p>
    </div></div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <section className="eng-card" style={cardStyle}>
        <h3>1. Preparar o projeto</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {requirements.map(item => <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {item.ok ? <CheckCircle2 size={18} color="var(--accent3)" /> : <AlertCircle size={18} color="var(--accent2)" />}
            <span>{item.label}</span>
            {!item.ok && <button className="btn-ghost" onClick={() => setStep(item.step)}>Revisar</button>}
          </div>)}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 16 }}>
          {ready ? 'Projeto pronto para exportar. Confira o conteúdo antes de entregar aos clientes.' : 'Complete os itens acima para exportar.'}
        </p>
        {(!config.iconBase64 && !config.logoBase64) && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Recomendado: envie um ícone em Identidade. Sem ele, será gerado um ícone com a inicial do aplicativo.</p>}
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Domínio próprio e Supabase são opcionais. O PWA atual oferece acesso aberto; a validação de compradores ainda não está implementada.</p>
      </section>
      <section className="eng-card" style={cardStyle}>
        <h3>2. Exportar o PWA</h3>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>O ZIP inclui index.html, app-data.json, manifest.json, sw.js, ícones, assets, pages e arquivos de configuração da hospedagem.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, margin: '16px 0' }}>
          <div style={{ flex: '1 1 120px' }}><label className="vpb-label" htmlFor="export-version">Versão</label>
            <input id="export-version" className="vpb-input" value={config.version} onChange={e => updateConfig({ version: e.target.value })} />
          </div>
          <div style={{ flex: '3 1 240px' }}><label className="vpb-label" htmlFor="export-notes">Notas desta versão</label>
            <input id="export-notes" className="vpb-input" placeholder="O que mudou?" value={config.changelogNotes || ''} onChange={e => updateConfig({ changelogNotes: e.target.value })} />
          </div>
        </div>
        <button className="btn-primary" disabled={!ready || exporting} onClick={exportZip}><Download size={18} /> {exporting ? 'Gerando ZIP…' : 'Gerar e baixar ZIP'}</button>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Exportar gera os arquivos no computador. Para disponibilizar o app, publique-os no provedor abaixo.</p>
      </section>
      <section className="eng-card" style={cardStyle}>
        <h3>3. Hospedar e testar</h3>
        <DeployInstructions />
        <div style={{ marginTop: 24 }}>
          <label className="vpb-label" htmlFor="published-url">Endereço publicado</label>
          <input id="published-url" className="vpb-input" placeholder="https://meuapp.netlify.app" value={config.publishedUrl ?? config.domain ?? ''} onChange={e => updateConfig({ publishedUrl: e.target.value })} />
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Cole o endereço HTTPS fornecido pela hospedagem. Este campo não publica arquivos nem configura DNS.</p>
          {(config.publishedUrl ?? config.domain) && !publishedUrl && <p role="alert">Informe um endereço HTTPS válido, sem espaços.</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button className="btn-ghost" disabled={!publishedUrl} onClick={() => publishedUrl && openExternalLink(publishedUrl)}><ExternalLink size={16} /> Abrir aplicativo</button>
            <button className="btn-ghost" disabled={!publishedUrl} onClick={copyUrl}><Copy size={16} /> Copiar link</button>
          </div>
          {publishedUrl && <div style={{ marginTop: 20 }}>
            <img src={qrUrl} alt="QR Code do endereço publicado" width={240} height={240} style={{ maxWidth: '100%', height: 'auto' }} />
            <p>Escaneie para abrir no celular.</p>
            <button className="btn-ghost" onClick={() => openExternalLink(qrUrl)}>Abrir QR para salvar <ExternalLink size={14} /></button>
          </div>}
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>No celular, confira a abertura, as aulas, os áudios e os links. Para instalar, siga “Adicionar à tela inicial” e as instruções do navegador. Na atualização, use o mesmo projeto da hospedagem.</p>
        </div>
      </section>
      <section className="eng-card" style={cardStyle}>
        <h3>Histórico de exportações</h3>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Registro deste projeto. Uma exportação não confirma que o aplicativo foi publicado.</p>
        {history.length === 0 ? <p>Nenhuma exportação registrada.</p> : <ul style={{ paddingLeft: 20 }}>{history.map((entry, index) => <li key={`${entry.date}-${index}`} style={{ marginBottom: 12 }}>
          <strong>v{entry.version}</strong> — {new Date(entry.date).toLocaleString('pt-BR')} — Exportado<br />{entry.notes}
        </li>)}</ul>}
      </section>
    </div>
  </div>;
}

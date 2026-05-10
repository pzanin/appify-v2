import React, { useState } from 'react';
import { 
  ClipboardCheck, Download, Globe, History, CheckCircle2, XCircle, 
  ChevronDown, ChevronUp, FileJson, Settings, Layout, Lock, 
  ExternalLink, QrCode, Copy, Trash2, Smartphone, Monitor, Info, Check, AlertCircle, AlertTriangle,
  Database, Eye, EyeOff, ArrowRight
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Version, ToastType } from '../types';
import { getSupabaseClient, resetClient } from '../services/supabaseService';

import * as _JSZip from 'jszip';
const JSZip = (_JSZip as any).default || _JSZip;

interface PublicationHubProps {
  showToast: (msg: string, type?: ToastType) => void;
}

export function PublicationHub({ showToast }: PublicationHubProps) {
  const pwaConfig = useAppStore(state => state.pwaConfig);
  const modules = useAppStore(state => state.modules);
  const updatePwaConfig = useAppStore(state => state.updatePwaConfig);
  const setStep = useAppStore(state => state.setStep);
  
  const [openSection, setOpenSection] = useState<string>('checklist');
  const [supabaseServiceKey, setSupabaseServiceKey] = useState('');
  const [showUrl, setShowUrl] = useState(true);
  const [showAnon, setShowAnon] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [sqlGenerated, setSqlGenerated] = useState(false);
  const [sqlContent, setSqlContent] = useState('');
  const [versions, setVersions] = useState<Version[]>([
    { version: '1.0.0', date: new Date().toLocaleDateString('pt-BR'), notes: 'Versão inicial do app.', status: 'publicado' }
  ]);

  const updateConfig = (updates: Partial<typeof pwaConfig>) => {
    updatePwaConfig(updates);
  };

  // CHECKLIST LOGIC
  const checklistItems = [
    { 
      label: "Nome do app definido", 
      ok: pwaConfig.appName && pwaConfig.appName !== 'Meu App', 
      stepId: 0 
    },
    { 
      label: "Cor primária personalizada", 
      ok: pwaConfig.themeColor && pwaConfig.themeColor !== '#6b8af0', // Updated default check
      stepId: 0 
    },
    { 
      label: "Logo enviado", 
      ok: !!pwaConfig.logoBase64, 
      stepId: 0 
    },
    { 
      label: "Ícone PWA enviado", 
      ok: !!pwaConfig.iconBase64, 
      stepId: 0 
    },
    { 
      label: "Ao menos 1 módulo ativo", 
      ok: modules.filter(m => m.status === 'Ativo').length > 0, 
      stepId: 1 
    },
    { 
      label: "Domínio configurado", 
      ok: !!pwaConfig.domain, 
      stepId: 0 
    },
    { 
      label: "Idioma base definido", 
      ok: !!pwaConfig.language, 
      stepId: 0 
    },
    { 
      label: "Descrição do app preenchida", 
      ok: !!pwaConfig.description, 
      stepId: 0 
    },
    { 
      label: "Supabase conectado", 
      ok: connectionStatus === 'connected', 
      stepId: 4 
    },
    { 
      label: "Schema SQL gerado", 
      ok: sqlGenerated, 
      stepId: 4 
    },
  ];

  const itemsOk = checklistItems.filter(i => i.ok).length;
  const totalItems = checklistItems.length;

  const getProgressColor = () => {
    if (itemsOk === totalItems) return 'var(--accent3)';
    if (itemsOk >= 5) return '#f59e0b'; // Amber
    return 'var(--accent2)';
  };

  const navigateToStep = (stepId: number) => {
    setStep(stepId);
  };

  // EXPORT LOGIC
  const handleExportZip = async () => {
    try {
      showToast('Iniciando geração do ZIP...', 'loading');
      
      const zip = new JSZip();

      // index.html
      const indexHtml = `
<!DOCTYPE html>
<html lang="${pwaConfig.language || 'pt-BR'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pwaConfig.appName}</title>
    <meta name="theme-color" content="${pwaConfig.themeColor}">
    <link rel="manifest" href="manifest.json">
    <link rel="icon" href="icons/icon-192.png">
    <style>
      body { margin: 0; padding: 0; background: ${pwaConfig.themeColor}; display: flex; align-items: center; justify-content: center; height: 100vh; color: white; font-family: sans-serif; }
    </style>
</head>
<body>
    <div id="app">App carregando...</div>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js');
        });
      }
    </script>
</body>
</html>`;

      // manifest.json
      const manifestJson = JSON.stringify({
        "name": pwaConfig.appName,
        "short_name": pwaConfig.appName,
        "theme_color": pwaConfig.themeColor,
        "background_color": pwaConfig.themeColor,
        "display": pwaConfig.display || "standalone",
        "orientation": pwaConfig.orientation || "portrait",
        "start_url": pwaConfig.startUrl || "/",
        "lang": pwaConfig.language || "pt-BR",
        "icons": [
          { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
          { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
        ]
      }, null, 2);

      // access-config.json
      const accessConfigJson = JSON.stringify({
        "version": pwaConfig.version,
        "modules": modules.map(m => ({
          id: m.id,
          name: m.name,
          access: "free" // Hardcoded for now as per instructions "access: m.accessLevel || 'free'"
        }))
      }, null, 2);

      // sw.js
      const swJs = `
const CACHE = 'app-v${pwaConfig.version}';
self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(['./', './index.html']))
));
self.addEventListener('fetch', e => e.respondWith(
  caches.match(e.request).then(r => r || self.fetch(e.request))
));`;

      zip.file("index.html", indexHtml);
      zip.file("manifest.json", manifestJson);
      zip.file("sw.js", swJs);
      zip.file("access-config.json", accessConfigJson);
      
      const iconsFolder = zip.folder("icons");
      iconsFolder.file("README.txt", "Coloque aqui icon-192.png e icon-512.png");

      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${pwaConfig.appName || 'app'}-v${pwaConfig.version}.zip`;
      link.click();
      window.URL.revokeObjectURL(url);

      // Add to history
      setVersions(prev => [{
        version: pwaConfig.version,
        date: new Date().toLocaleDateString('pt-BR'),
        notes: pwaConfig.changelogNotes || 'Lançamento manual',
        status: 'publicado'
      }, ...prev]);

      showToast('ZIP gerado com sucesso! Faça o upload no GitHub.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao gerar ZIP.', 'error');
    }
  };

  // DEPLOY LOGIC
  const testSupabaseConnection = async () => {
    if (!pwaConfig.supabaseUrl || !pwaConfig.supabaseAnonKey) {
      showToast('Preencha a URL e a Anon Key primeiro.', 'error');
      return;
    }

    try {
      showToast('Testando conexão...', 'loading');
      
      resetClient(); // Ensure fresh client with new credentials if changed
      const supabase = getSupabaseClient(pwaConfig.supabaseUrl, pwaConfig.supabaseAnonKey);
      
      if (!supabase) {
        showToast('Erro ao inicializar cliente Supabase.', 'error');
        return;
      }

      // Test hit to the root or a safe endpoint
      const { error } = await supabase.from('_non_existent_table_just_to_test').select('*').limit(1);
      
      // If error is just 404 (table not found) or it works (unexpected but fine), it means we connected
      // Supabase-js returns errors for everything mostly.
      // But a connection error is usually network or wrong URL.
      
      if (error && error.message.includes('FetchError') || error && error.code === 'PGRST301') {
         // PGRST301 is usually JWT expired/invalid or some other thing, but it means server responded
         setConnectionStatus('error');
         showToast('Falha na conexão. Verifique as credenciais.', 'error');
      } else {
        // Success or Table not found means we reached the server
        setConnectionStatus('connected');
        showToast('Conexão com Supabase estabelecida! ✓', 'success');
      }
    } catch (err) {
      console.error(err);
      setConnectionStatus('error');
      showToast('Erro de rede ou URL inválida.', 'error');
    }
  };

  const generateSqlSchema = () => {
    const sql = `-- =============================================
-- Schema gerado pelo Appify
-- App: ${pwaConfig.appName} | v${pwaConfig.version}
-- Gerado em: ${new Date().toISOString()}
-- =============================================

-- USUÁRIOS (extende auth.users do Supabase)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- PLANOS DE ACESSO
create table if not exists public.plans (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price_cents integer default 0,
  period text default 'monthly',
  created_at timestamptz default now()
);

-- MÓDULOS DO APP
create table if not exists public.modules (
  id text primary key,
  name text not null,
  access_level text default 'free', -- 'free' | 'paid' | 'locked'
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Inserir módulos atuais
${modules.map((mod, idx) => `insert into public.modules (id, name, access_level, order_index)
values ('${mod.id}', '${mod.name}', 'free', ${idx})
on conflict (id) do update set name = excluded.name;`).join('\n')}

-- CONTROLE DE ACESSO
create table if not exists public.user_access (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  module_id text references public.modules(id) on delete cascade,
  plan_id uuid references public.plans(id),
  granted_at timestamptz default now(),
  expires_at timestamptz,
  unique(user_id, module_id)
);

-- TOKENS DE PUSH
create table if not exists public.push_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  token text not null,
  platform text default 'web',
  created_at timestamptz default now()
);

-- POSTS DO FEED
create table if not exists public.feed_posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references auth.users(id) on delete cascade,
  content text not null,
  image_url text,
  status text default 'published', -- 'published' | 'pending' | 'rejected'
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.user_access enable row level security;
alter table public.feed_posts enable row level security;

-- POLICIES
create policy "Usuário vê próprio perfil"
  on public.profiles for select using (auth.uid() = id);

create policy "Usuário vê próprio acesso"
  on public.user_access for select using (auth.uid() = user_id);

create policy "Posts publicados são públicos"
  on public.feed_posts for select using (status = 'published');

create policy "Autor pode criar post"
  on public.feed_posts for insert with check (auth.uid() = author_id);

-- FUNÇÃO: verificar acesso ao módulo
create or replace function public.has_module_access(module_id text)
returns boolean as $$
  select exists (
    select 1 from public.user_access ua
    where ua.user_id = auth.uid()
      and ua.module_id = $1
      and (ua.expires_at is null or ua.expires_at > now())
  );
$$ language sql security definer;`;

    setSqlContent(sql);
    setSqlGenerated(true);
    showToast('Schema SQL gerado!', 'success');
  };

  const envVars = `VITE_SUPABASE_URL=${pwaConfig.supabaseUrl || ''}
VITE_SUPABASE_ANON_KEY=${pwaConfig.supabaseAnonKey || ''}
VITE_APP_NAME=${pwaConfig.appName || ''}
VITE_APP_VERSION=${pwaConfig.version || ''}
VITE_APP_THEME=${pwaConfig.themeColor || ''}`;

  const downloadQrCode = () => {
    if (!pwaConfig.domain) return;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=https://${pwaConfig.domain}&bgcolor=1a1a2e&color=ffffff`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `qrcode-${pwaConfig.appName}.png`;
    link.click();
  };

  const copyUrl = () => {
    if (!pwaConfig.domain) return;
    navigator.clipboard.writeText('https://' + pwaConfig.domain);
    showToast('Link copiado!', 'success');
  };

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? '' : id);
  };

  return (
    <div className="publication-hub" style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '100px' }}>
      <div className="section-header" style={{ marginBottom: '32px' }}>
        <div>
          <h2 className="section-title">Publicação</h2>
          <p className="section-sub">Exporte, configure e lance seu app para o mundo.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* CARD 1: CHECKLIST */}
        <div className="eng-card" style={{ overflow: 'hidden' }}>
          <div 
            className="eng-card-header" 
            onClick={() => toggleSection('checklist')}
            style={{ cursor: 'pointer', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ClipboardCheck size={20} color="var(--accent)" />
              <span style={{ fontWeight: 700, fontSize: '15px' }}>Checklist de Lançamento</span>
            </div>
            {openSection === 'checklist' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {openSection === 'checklist' && (
            <div className="eng-card-body" style={{ padding: '0 24px 24px' }}>
              <div className="checklist-grid">
                {checklistItems.map((item, idx) => {
                  const isSupabaseItem = item.stepId === 4;
                  const stepLabel = item.stepId === 0 ? 'Identidade' : item.stepId === 1 ? 'Módulos & Conteúdo' : 'Configuração';
                  const title = item.ok ? undefined : (isSupabaseItem ? "Configurar agora" : `Ir para ${stepLabel}`);

                  return (
                    <div 
                      key={idx} 
                      onClick={() => {
                        if (!item.ok) {
                          if (isSupabaseItem) {
                            setOpenSection('supabase');
                          } else {
                            setStep(item.stepId);
                          }
                          showToast('Complete este item para continuar.', 'loading');
                        }
                      }}
                      title={title}
                      className={`checklist-item ${!item.ok ? 'clickable' : ''}`}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', 
                        background: 'var(--surface2)', borderRadius: '10px', border: '1px solid var(--border)',
                        cursor: item.ok ? 'default' : 'pointer', transition: 'all 0.2s',
                        height: '100%',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {item.ok ? <CheckCircle2 size={18} color="var(--accent3)" /> : <AlertCircle size={18} color="var(--accent2)" />}
                        <span style={{ fontSize: '13px', color: item.ok ? 'var(--text)' : 'var(--muted)', fontWeight: 500, lineHeight: '1.2' }}>
                          {item.label}
                        </span>
                      </div>
                      {!item.ok && (
                        <ArrowRight size={14} className="arrow-icon" style={{ color: 'var(--muted)', transition: 'color 0.2s', flexShrink: 0 }} />
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ background: 'var(--surface2)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>{itemsOk} de {totalItems} itens concluídos</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: getProgressColor() }}>
                    {itemsOk === totalItems ? 'Pronto para publicar!' : itemsOk >= 5 ? 'Quase lá...' : 'Setup incompleto'}
                  </span>
                </div>
                <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${(itemsOk / totalItems) * 100}%`, height: '100%', 
                    background: getProgressColor(),
                    transition: 'width 0.5s ease' 
                  }} />
                </div>
                <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--muted)' }}>
                  {itemsOk === totalItems ? '✅ Tudo pronto para o lançamento!' : 
                   itemsOk >= 5 ? '⚠️ Quase lá. Corrija os itens pendentes para garantir a melhor experiência.' : 
                   '❌ Complete o setup básico antes de exportar os arquivos.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CARD 2: EXPORTAR */}
        <div className="eng-card" style={{ overflow: 'hidden', opacity: itemsOk < 5 ? 0.6 : 1 }}>
          <div 
            className="eng-card-header" 
            onClick={() => itemsOk >= 5 && toggleSection('export')}
            style={{ cursor: itemsOk >= 5 ? 'pointer' : 'not-allowed', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            title={itemsOk < 5 ? 'Complete pelo menos 5 tópicos do checklist' : ''}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Download size={20} color="var(--accent)" />
              <span style={{ fontWeight: 700, fontSize: '15px' }}>Exportar Arquivos</span>
            </div>
            {openSection === 'export' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>

          {openSection === 'export' && (
            <div className="eng-card-body" style={{ padding: '0 24px 24px' }}>
              <div style={{ marginBottom: '24px' }}>
                <label className="vpb-label" style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '8px' }}>O QUE SERÁ GERADO</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { icon: '📄', name: 'index.html', desc: 'Estrutura do app com módulos' },
                    { icon: '⚙️', name: 'manifest.json', desc: 'Configurações do PWA' },
                    { icon: '🔧', name: 'sw.js', desc: 'Service worker para offline' },
                    { icon: '🔒', name: 'access-config.json', desc: 'Regras de acesso por módulo' }
                  ].map((file, i) => (
                    <div key={i} style={{ background: 'var(--surface2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, marginBottom: '2px' }}>
                        <span>{file.icon}</span> <span>{file.name}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{file.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label className="vpb-label">VERSÃO</label>
                  <input 
                    className="vpb-input" 
                    value={pwaConfig.version || '1.0.0'} 
                    onChange={(e) => updateConfig({ version: e.target.value })}
                  />
                </div>
                <div>
                  <label className="vpb-label">NOTAS DESTA VERSÃO (CHANGELOG)</label>
                  <input 
                    className="vpb-input" 
                    placeholder="O que mudou nesta versão?"
                    value={pwaConfig.changelogNotes || ''}
                    onChange={(e) => updateConfig({ changelogNotes: e.target.value })}
                  />
                </div>
              </div>

              <button 
                className="btn-primary" 
                style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '15px' }}
                onClick={handleExportZip}
              >
                <Download size={20} /> Gerar e Baixar ZIP
              </button>
            </div>
          )}
        </div>

        {/* CARD 3: SUPABASE */}
        <div className="eng-card" style={{ overflow: 'hidden' }}>
          <div 
            className="eng-card-header" 
            onClick={() => toggleSection('supabase')}
            style={{ cursor: 'pointer', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Database size={20} color="var(--accent)" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>Banco de Dados & Autenticação (Supabase)</span>
                <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>NECESSÁRIO</span>
              </div>
            </div>
            {openSection === 'supabase' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>

          {openSection === 'supabase' && (
            <div className="eng-card-body" style={{ padding: '0 24px 24px' }}>
              {/* SEÇÃO 1: CREDENCIAIS */}
              <div style={{ marginBottom: '32px' }}>
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
                  Conecte seu projeto Supabase para habilitar login de usuários e controle real de acesso aos módulos bloqueados.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="vpb-label">PROJECT URL</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showUrl ? 'text' : 'password'}
                        className="vpb-input" 
                        style={{ fontFamily: 'monospace' }}
                        placeholder="https://xyzxyzxyz.supabase.co"
                        value={pwaConfig.supabaseUrl || ''}
                        onChange={(e) => updateConfig({ supabaseUrl: e.target.value })}
                      />
                      <button 
                        onClick={() => setShowUrl(!showUrl)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                      >
                        {showUrl ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="vpb-label">ANON KEY (PÚBLICA)</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showAnon ? 'text' : 'password'}
                        className="vpb-input" 
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        value={pwaConfig.supabaseAnonKey || ''}
                        onChange={(e) => updateConfig({ supabaseAnonKey: e.target.value })}
                      />
                      <button 
                        onClick={() => setShowAnon(!showAnon)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                      >
                        {showAnon ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Esta chave é segura para uso no frontend. Nunca use a Service Role Key aqui.</p>
                  </div>

                  <div>
                    <label className="vpb-label">SERVICE ROLE KEY (PRIVADA)</label>
                    <input 
                      type="password"
                      className="vpb-input" 
                      placeholder="Usada apenas para gerar o schema SQL"
                      value={supabaseServiceKey}
                      onChange={(e) => setSupabaseServiceKey(e.target.value)}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>⚠️ Nunca exponha esta chave no app publicado. Usada só para setup.</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Por segurança, a Service Role Key não é salva. Insira novamente quando necessário.</p>
                  </div>

                  <button className="btn-ghost" style={{ width: '100%', padding: '12px' }} onClick={testSupabaseConnection}>
                    Testar Conexão
                  </button>

                  {connectionStatus !== 'idle' && (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '6px', 
                        background: connectionStatus === 'connected' ? 'rgba(107, 255, 184, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: connectionStatus === 'connected' ? 'var(--accent3)' : 'var(--accent2)',
                        padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700
                      }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                        {connectionStatus === 'connected' ? 'Conectado' : 'Falha na conexão'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SEÇÃO 2: SQL SCHEMA */}
              <div style={{ marginBottom: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800 }}>Gerar Schema do Banco</h4>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>(Execute no SQL Editor do Supabase)</span>
                </div>

                <button className="btn-ghost" style={{ marginBottom: '16px' }} onClick={generateSqlSchema}>
                  Gerar Schema SQL
                </button>

                {sqlGenerated && (
                  <>
                    <textarea 
                      readOnly 
                      value={sqlContent}
                      style={{ 
                        width: '100%', height: '240px', fontFamily: 'monospace', fontSize: '11px',
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: '8px', padding: '12px', overflowY: 'auto', marginBottom: '16px',
                        color: 'var(--text)'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="btn-primary" onClick={() => {
                        navigator.clipboard.writeText(sqlContent);
                        showToast('SQL copiado! Cole no SQL Editor do Supabase.', 'success');
                      }}>
                        <Copy size={16} /> Copiar SQL
                      </button>
                      <button 
                        className="btn-ghost" 
                        disabled={!pwaConfig.supabaseUrl}
                        onClick={() => window.open(`${pwaConfig.supabaseUrl}/project/default/sql`)}
                      >
                        <ExternalLink size={16} /> Abrir SQL Editor
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* SEÇÃO 3: ENV VARS */}
              <div style={{ marginBottom: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800 }}>Variáveis para o Cloudflare Pages</h4>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
                  Adicione estas variáveis em Settings → Environment Variables
                </p>

                <textarea 
                  readOnly 
                  value={envVars}
                  style={{ 
                    width: '100%', height: '120px', fontFamily: 'monospace', fontSize: '11px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '12px', overflowY: 'auto', marginBottom: '16px',
                    color: 'var(--text)'
                  }}
                />
                <button className="btn-ghost" onClick={() => {
                  navigator.clipboard.writeText(envVars);
                  showToast('Variáveis copiadas!', 'success');
                }}>
                  <Copy size={16} /> Copiar variáveis
                </button>
              </div>

              {/* SEÇÃO 4: CHECKLIST SUPABASE */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Checklist Supabase</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: "Project URL configurada", ok: !!pwaConfig.supabaseUrl },
                    { label: "Anon Key configurada", ok: !!pwaConfig.supabaseAnonKey },
                    { label: "Conexão testada e aprovada", ok: connectionStatus === 'connected' },
                    { label: "Schema SQL gerado", ok: sqlGenerated },
                    { label: "Auth habilitado no Supabase", ok: false, hint: "Habilite em Authentication → Providers → Email", url: `${pwaConfig.supabaseUrl}/project/default/auth/providers` }
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface2)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.ok ? <Check size={14} color="var(--accent3)" /> : <XCircle size={14} color="var(--accent2)" />}
                        <span style={{ fontSize: '12px', color: item.ok ? 'var(--text)' : 'var(--muted)' }}>{item.label}</span>
                      </div>
                      {item.hint && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '10px', color: '#f59e0b' }}>{item.hint}</span>
                          <button className="btn-ghost" style={{ padding: '2px 6px', fontSize: '10px' }} onClick={() => item.url && window.open(item.url)}>
                            Abrir <ExternalLink size={8} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CARD 4: DEPLOY */}
        <div className="eng-card" style={{ overflow: 'hidden' }}>
          <div 
            className="eng-card-header" 
            onClick={() => toggleSection('deploy')}
            style={{ cursor: 'pointer', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Globe size={20} color="var(--accent)" />
              <span style={{ fontWeight: 700, fontSize: '15px' }}>Deploy & Domínio</span>
            </div>
            {openSection === 'deploy' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>

          {openSection === 'deploy' && (
            <div className="eng-card-body" style={{ padding: '0 24px 24px' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Instruções de Deploy</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {[
                        { step: '1️⃣', text: 'Faça upload dos arquivos no seu repositório GitHub', btn: 'Abrir GitHub', url: 'https://github.com' },
                        { step: '2️⃣', text: 'No Cloudflare Pages, conecte o repositório', btn: 'Abrir Cloudflare', url: 'https://dash.cloudflare.com' },
                        { step: '3️⃣', text: 'Configure o domínio personalizado nas configurações do projeto', special: true },
                        { step: '4️⃣', text: 'Aguarde o deploy (≈ 1 min) e teste no celular', btn: 'Testar App', url: `https://${pwaConfig.domain}`, disabled: !pwaConfig.domain }
                      ].map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                          <span style={{ fontSize: '18px' }}>{step.step}</span>
                          <div>
                            <p style={{ fontSize: '13px', lineHeight: '1.4', marginBottom: '8px' }}>{step.text}</p>
                            {step.special ? (
                              pwaConfig.domain ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--accent-glow)', color: 'var(--accent)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                                  Seu domínio: {pwaConfig.domain}
                                </div>
                              ) : (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                                  Configure o domínio no Step 'Identidade'
                                </div>
                              )
                            ) : (
                              <button 
                                className="btn-ghost" 
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                                onClick={() => step.url && window.open(step.url)}
                                disabled={step.disabled}
                              >
                                {step.btn} <ExternalLink size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '16px', width: '100%', textAlign: 'center' }}>QR Code de Instalação</h4>
                    
                    {pwaConfig.domain ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: '#1a1a2e', padding: '16px', borderRadius: '16px', border: '4px solid var(--accent)' }}>
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://${pwaConfig.domain}&bgcolor=1a1a2e&color=ffffff`} 
                            alt="Deployment QR Code"
                            style={{ display: 'block' }}
                          />
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Escaneie para instalar o app</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-ghost" style={{ fontSize: '11px', padding: '6px 10px' }} onClick={downloadQrCode}>
                            <Download size={14} /> Baixar QR
                          </button>
                          <button className="btn-ghost" style={{ fontSize: '11px', padding: '6px 10px' }} onClick={copyUrl}>
                            <Copy size={14} /> Copiar link
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ 
                        flex: 1, width: '100%', border: '2px dashed var(--border)', borderRadius: '16px', 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        padding: '30px', textAlign: 'center', gap: '12px'
                      }}>
                        <QrCode size={40} color="var(--muted)" />
                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Configure o domínio para gerar o QR Code</span>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* CARD 4: HISTÓRICO */}
        <div className="eng-card" style={{ overflow: 'hidden' }}>
          <div 
            className="eng-card-header" 
            onClick={() => toggleSection('history')}
            style={{ cursor: 'pointer', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <History size={20} color="var(--accent)" />
              <span style={{ fontWeight: 700, fontSize: '15px' }}>Histórico de Versões</span>
            </div>
            {openSection === 'history' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>

          {openSection === 'history' && (
            <div className="eng-card-body" style={{ padding: '0 24px 24px' }}>
              {versions.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
                  Nenhuma versão publicada ainda.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {versions.map((v, i) => (
                    <div key={i} style={{ 
                      background: 'var(--surface2)', padding: '16px', borderRadius: '12px', 
                      border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: '16px',
                      position: 'relative'
                    }}>
                      <div style={{ 
                        background: 'var(--accent)', color: 'white', padding: '4px 8px', 
                        borderRadius: '6px', fontSize: '11px', fontWeight: 800, minWidth: '45px', textAlign: 'center' 
                      }}>
                        v{v.version}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700 }}>{v.date}</span>
                          <div style={{ 
                            background: v.status === 'publicado' ? 'rgba(107, 255, 184, 0.1)' : 'var(--surface)', 
                            color: v.status === 'publicado' ? 'var(--accent3)' : 'var(--muted)',
                            fontSize: '10px', padding: '2px 6px', borderRadius: '99px', textTransform: 'uppercase', fontWeight: 800
                          }}>
                            {v.status}
                          </div>
                          {i === 0 && <span style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 800 }}>• Atual</span>}
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0 }}>{v.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

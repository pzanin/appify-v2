import React from 'react';
import { ToggleRight, Monitor, Play, Sparkles, RefreshCw, Smartphone } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function AppConfigurator() {
  const pwaConfig = useAppStore(state => state.pwaConfig);
  const updatePwaConfig = useAppStore(state => state.updatePwaConfig);

  const updateConfig = (updates: Partial<typeof pwaConfig>) => {
    updatePwaConfig(updates);
  };

  const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

  return (
    <div className="eng-wrapper" style={{ animation: 'fadeIn 0.3s ease', paddingBottom: '80px' }}>
      <div className="section-header" style={{ marginBottom: '32px' }}>
        <div>
          <h2 className="section-title">Configurações Técnicas (PWA)</h2>
          <p className="section-sub">Ajustes avançados para o comportamento em dispositivos móveis e offline.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* MODO OFFLINE */}
          <div className="eng-card">
            <div className="eng-card-body" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                 <div style={{ background: 'var(--accent-glow)', color: 'var(--accent)', padding: '10px', borderRadius: '10px' }}>
                    <RefreshCw size={20} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '2px' }}>Modo Offline</div>
                    <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '0' }}>
                      O aplicativo funcionará sem internet após o primeiro acesso, utilizando cache inteligente.
                    </p>
                 </div>
                 <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={pwaConfig.offlineMode !== false}
                      onChange={() => updateConfig({ offlineMode: !pwaConfig.offlineMode })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
              </div>
            </div>
          </div>

          {/* COMPORTAMENTO DE TELA */}
          <div className="eng-card">
            <div className="eng-card-header">
               <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Monitor size={14} /> COMPORTAMENTO DE TELA
               </div>
            </div>
            <div className="eng-card-body" style={{ padding: '24px' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label className="vpb-label">ORIENTAÇÃO</label>
                    <select 
                      className="vpb-input" 
                      value={pwaConfig.orientation || 'portrait'}
                      onChange={(e) => updateConfig({ orientation: e.target.value })}
                    >
                      <option value="any">Qualquer</option>
                      <option value="portrait">Retrato</option>
                      <option value="landscape">Paisagem</option>
                    </select>
                  </div>
                  <div>
                    <label className="vpb-label">DISPLAY MODE</label>
                    <select 
                      className="vpb-input" 
                      value={pwaConfig.display || 'standalone'}
                      onChange={(e) => updateConfig({ display: e.target.value })}
                    >
                      <option value="standalone">Standalone (App-like)</option>
                      <option value="fullscreen">Fullscreen</option>
                      <option value="minimal-ui">Minimal UI</option>
                    </select>
                  </div>
               </div>
               <div>
                  <label className="vpb-label">URL DE START</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '13px' }}>/</div>
                    <input 
                      className="vpb-input" 
                      placeholder="start_url" 
                      style={{ paddingLeft: '24px' }}
                      value={pwaConfig.startUrl || '/'}
                      onChange={(e) => updateConfig({ startUrl: e.target.value })}
                    />
                  </div>
               </div>
            </div>
          </div>

          {/* SPLASH SCREEN */}
          <div className="eng-card">
            <div className="eng-card-body" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                 <div style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: '10px', borderRadius: '10px' }}>
                    <Sparkles size={20} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '2px' }}>Splash Screen Personalizada</div>
                    <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '0' }}>
                      Utilizar a Splash Screen gerada pela plataforma em vez da padrão do navegador.
                    </p>
                 </div>
                 <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={pwaConfig.customSplash !== false}
                      onChange={() => updateConfig({ customSplash: !pwaConfig.customSplash })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
              </div>
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
           {/* ÍCONES GERADOS */}
           <div className="eng-card">
            <div className="eng-card-header">
               <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
                  ÍCONES GERADOS NO EXPORT
               </div>
            </div>
            <div className="eng-card-body" style={{ padding: '24px' }}>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {iconSizes.map(size => (
                    <div key={size} style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                       {pwaConfig.iconBase64 ? (
                         <img src={pwaConfig.iconBase64} alt={`${size}x${size}`} style={{ width: '32px', height: '32px', borderRadius: size > 48 ? '6px' : '4px', objectFit: 'contain' }} />
                       ) : (
                         <div style={{ width: '32px', height: '32px', background: 'var(--accent-glow)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                           <Smartphone size={16} />
                         </div>
                       )}
                       <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--muted)' }}>{size}x{size}</span>
                    </div>
                  ))}
               </div>
               <div style={{ marginTop: '20px', padding: '12px', background: 'var(--accent-glow)', borderRadius: '8px', fontSize: '11px', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                  Todos os ícones serão gerados automaticamente baseados na imagem enviada na aba <strong>Identidade</strong>.
               </div>
            </div>
           </div>
        </div>
      </div>
    </div>
  );
}

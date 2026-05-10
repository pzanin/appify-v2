import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, Trash2, Plus, Smartphone, Globe, 
  Languages, Palette, Info, EyeOff, LayoutGrid, Type, 
  Trash, AlertTriangle, Link as LinkIcon, CheckCircle2, XCircle, Loader2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { GOOGLE_FONTS } from '../constants';
import { SupportedLocale } from '../types';

export function IdentityConfigurator() {
  const pwaConfig = useAppStore(state => state.pwaConfig);
  const updatePwaConfig = useAppStore(state => state.updatePwaConfig);
  const setLocale = useAppStore(state => state.setLocale);

  const fileInputLogo = useRef<HTMLInputElement>(null);
  const fileInputIcon = useRef<HTMLInputElement>(null);

  const [fontLoaded, setFontLoaded] = useState(false);
  const [domainStatus, setDomainStatus] = useState<'none' | 'valid' | 'invalid'>('none');

  const updateConfig = (updates: Partial<typeof pwaConfig>) => {
    updatePwaConfig(updates);
  };

  useEffect(() => {
    // Inject Google Font
    setFontLoaded(false);
    const font = pwaConfig.fontFamily || 'Inter';
    const weight = pwaConfig.fontWeight || '400';
    const linkId = `google-font-${font.replace(/\s+/g, '-')}`;
    
    let link = document.getElementById(linkId) as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@${weight}&display=swap`;
      link.onload = () => setFontLoaded(true);
      document.head.appendChild(link);
    } else {
      setFontLoaded(true);
    }
  }, [pwaConfig.fontFamily, pwaConfig.fontWeight]);

  const validateDomain = (domain: string) => {
    if (!domain) {
      setDomainStatus('none');
      return;
    }
    const isValid = domain.includes('.') && !domain.startsWith('http');
    setDomainStatus(isValid ? 'valid' : 'invalid');
  };

  const [iconSizeWarning, setIconSizeWarning] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoBase64' | 'iconBase64') => {
    const file = e.target.files?.[0];
    if (file) {
      if (field === 'iconBase64') {
        const img = new Image();
        img.onload = () => {
          if (img.width < 512 || img.height < 512) setIconSizeWarning(true);
          else setIconSizeWarning(false);
        };
        img.src = URL.createObjectURL(file);
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        updateConfig({ [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addBanner = () => {
    const banners = pwaConfig.banners || [];
    if (banners.length >= 3) return;
    
    const presets = [
      ['#7c6fff', '#4facfe'],
      ['#f953c6', '#b91d73'],
      ['#f7971e', '#ffd200'],
      ['#6bffb8', '#00c9ff'],
      ['#ff6b6b', '#ffa07a']
    ];
    const randomPreset = presets[Math.floor(Math.random() * presets.length)];
    const newBanner = { 
      id: Date.now(), 
      colorA: randomPreset[0], 
      colorB: randomPreset[1], 
      link: '' 
    };
    updateConfig({ banners: [...banners, newBanner] });
  };

  const removeBanner = (id: number) => {
    updateConfig({ banners: (pwaConfig.banners || []).filter(b => b.id !== id) });
  };

  const updateBanner = (id: number, updates: Partial<typeof pwaConfig.banners[0]>) => {
    updateConfig({ 
      banners: (pwaConfig.banners || []).map(b => b.id === id ? { ...b, ...updates } : b) 
    });
  };

  return (
    <div className="eng-wrapper" style={{ animation: 'fadeIn 0.3s ease', paddingBottom: '80px' }}>
      <div className="section-header" style={{ marginBottom: '32px' }}>
        <div>
          <h2 className="section-title">Identidade do Aplicativo</h2>
          <p className="section-sub">Defina como sua marca será percebida pelos usuários.</p>
        </div>
      </div>

      {/* SEÇÃO 1: NOME & IDIOMA */}
      <div className="eng-card" style={{ marginBottom: '24px' }}>
        <div className="eng-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
            NOME & IDIOMA
          </div>
        </div>
        <div className="eng-card-body" style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label className="vpb-label">NOME DO APP</label>
              <input 
                className="vpb-input" 
                value={pwaConfig.appName}
                onChange={(e) => updateConfig({ appName: e.target.value })}
              />
            </div>
            <div>
              <label className="vpb-label">DOMÍNIO</label>
              <input 
                className={`vpb-input ${domainStatus === 'valid' ? 'border-accent-status' : domainStatus === 'invalid' ? 'border-error-status' : ''}`} 
                placeholder="seuapp.com" 
                value={pwaConfig.domain || ''}
                onChange={(e) => updateConfig({ domain: e.target.value })}
                onBlur={(e) => validateDomain(e.target.value)}
                style={{
                  borderColor: domainStatus === 'valid' ? 'var(--accent3)' : domainStatus === 'invalid' ? 'var(--accent2)' : undefined
                }}
              />
              {domainStatus === 'invalid' && (
                <p style={{ fontSize: 11, color: 'var(--accent2)', marginTop: 4 }}>
                  Use apenas o domínio, sem https:// (ex: meuapp.com)
                </p>
              )}
              {domainStatus === 'valid' && (
                <p style={{ fontSize: 11, color: 'var(--accent3)', marginTop: 4 }}>
                  ✓ Domínio válido
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="vpb-label">IDIOMA BASE</label>
            <select 
              className="vpb-input" 
              value={pwaConfig.language || 'pt-BR'}
              onChange={(e) => {
                const lang = e.target.value;
                updatePwaConfig({ language: lang });
                setLocale(lang as SupportedLocale);
              }}
            >
              <option value="pt-BR">🇧🇷 Português (BR)</option>
              <option value="en-US">🇺🇸 English (US)</option>
              <option value="es">🇪🇸 Español</option>
              <option value="fr">🇫🇷 Français</option>
            </select>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: '-8px' }}>
              Este é o idioma em que seu app será entregue ao usuário final.
            </p>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: PALETA DE CORES */}
      <div className="eng-card" style={{ marginBottom: '24px' }}>
        <div className="eng-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
            PALETA DE CORES
          </div>
        </div>
        <div className="eng-card-body" style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label className="vpb-label">COR PRIMÁRIA</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="color" 
                  value={pwaConfig.themeColor} 
                  onChange={(e) => updateConfig({ themeColor: e.target.value })}
                  style={{ width: '42px', height: '42px', padding: '0', border: 'none', background: 'transparent', cursor: 'pointer' }}
                />
                <input 
                  className="vpb-input" 
                  value={pwaConfig.themeColor}
                  onChange={(e) => updateConfig({ themeColor: e.target.value })}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <div>
              <label className="vpb-label">COR DO TEXTO</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="color" 
                  value={pwaConfig.textColor || '#FFFFFF'} 
                  onChange={(e) => updateConfig({ textColor: e.target.value })}
                  style={{ width: '42px', height: '42px', padding: '0', border: 'none', background: 'transparent', cursor: 'pointer' }}
                />
                <input 
                  className="vpb-input" 
                  value={pwaConfig.textColor || '#FFFFFF'}
                  onChange={(e) => updateConfig({ textColor: e.target.value })}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: TIPOGRAFIA */}
      <div className="eng-card" style={{ marginBottom: '24px' }}>
        <div className="eng-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
            TIPOGRAFIA
          </div>
        </div>
        <div className="eng-card-body" style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label className="vpb-label">FAMÍLIA DA FONTE</label>
              <select 
                className="vpb-input" 
                value={pwaConfig.fontFamily}
                onChange={(e) => updateConfig({ fontFamily: e.target.value })}
              >
                {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="vpb-label">PESO DA FONTE</label>
              <select 
                className="vpb-input" 
                value={pwaConfig.fontWeight || '400'}
                onChange={(e) => updateConfig({ fontWeight: e.target.value })}
              >
                <option value="400">400 (Regular)</option>
                <option value="500">500 (Medium)</option>
                <option value="600">600 (SemiBold)</option>
                <option value="700">700 (Bold)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label className="vpb-label">TAMANHO BASE (PX)</label>
              <input 
                type="number"
                className="vpb-input" 
                value={pwaConfig.fontSize || 16}
                onChange={(e) => updateConfig({ fontSize: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="vpb-label">COR DO TÍTULO</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="color" 
                  value={pwaConfig.titleColor || '#FFFFFF'} 
                  onChange={(e) => updateConfig({ titleColor: e.target.value })}
                  style={{ width: '38px', height: '38px', border: 'none', background: 'transparent' }}
                />
                <input className="vpb-input" value={pwaConfig.titleColor || '#FFFFFF'} onChange={(e) => updateConfig({ titleColor: e.target.value })} style={{ flex: 1, height: '38px' }} />
              </div>
            </div>
            <div>
              <label className="vpb-label">COR DO CORPO</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="color" 
                  value={pwaConfig.bodyColor || '#A0A0A0'} 
                  onChange={(e) => updateConfig({ bodyColor: e.target.value })}
                  style={{ width: '38px', height: '38px', border: 'none', background: 'transparent' }}
                />
                <input className="vpb-input" value={pwaConfig.bodyColor || '#A0A0A0'} onChange={(e) => updateConfig({ bodyColor: e.target.value })} style={{ flex: 1, height: '38px' }} />
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--surface2)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Preview de Tipografia</div>
              {!fontLoaded && (
                <span style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Loader2 size={10} className="animate-spin" /> Carregando fonte...
                </span>
              )}
            </div>
            <div style={{ 
              fontFamily: fontLoaded ? pwaConfig.fontFamily : 'inherit', 
              color: pwaConfig.titleColor, 
              fontWeight: pwaConfig.fontWeight, 
              fontSize: `${(pwaConfig.fontSize || 16) * 1.5}px`, 
              marginBottom: '4px',
              transition: 'font-family 0.3s ease'
            }}>
              {pwaConfig.appName}
            </div>
            <div style={{ 
              fontFamily: fontLoaded ? pwaConfig.fontFamily : 'inherit', 
              color: pwaConfig.bodyColor, 
              fontSize: `${pwaConfig.fontSize}px`,
              transition: 'font-family 0.3s ease'
            }}>
              Este é um exemplo de como o texto do seu aplicativo será visualizado pelos alunos.
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 4: IDENTIDADE VISUAL */}
      <div className="eng-card" style={{ marginBottom: '24px' }}>
        <div className="eng-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
            IDENTIDADE VISUAL
          </div>
        </div>
        <div className="eng-card-body" style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label className="vpb-label">LOGO INTERNO</label>
              <div 
                className="upload-area" 
                onClick={() => fileInputLogo.current?.click()}
                style={{ 
                  border: '2px dashed var(--border)', borderRadius: '12px', padding: '20px', 
                  textAlign: 'center', cursor: 'pointer', background: 'var(--surface2)',
                  minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', position: 'relative'
                }}
              >
                <input type="file" ref={fileInputLogo} hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'logoBase64')} />
                {pwaConfig.logoBase64 ? (
                  <>
                    <img src={pwaConfig.logoBase64} alt="Logo" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateConfig({ logoBase64: null }); }}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      <Trash size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <ImageIcon size={28} color="var(--muted)" />
                    <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>Enviar Logo</span>
                  </>
                )}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px' }}>Usado dentro do app (header, splash)</p>
            </div>
            <div>
              <label className="vpb-label">ÍCONE PWA</label>
              <div 
                className="upload-area" 
                onClick={() => fileInputIcon.current?.click()}
                style={{ 
                  border: '2px dashed var(--border)', borderRadius: '12px', padding: '20px', 
                  textAlign: 'center', cursor: 'pointer', background: 'var(--surface2)',
                  minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', position: 'relative'
                }}
              >
                <input type="file" ref={fileInputIcon} hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'iconBase64')} />
                {pwaConfig.iconBase64 ? (
                  <>
                    <img src={pwaConfig.iconBase64} alt="Icon" style={{ width: '64px', height: '64px', borderRadius: '14px', objectFit: 'contain' }} />
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateConfig({ iconBase64: null }); }}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      <Trash size={14} />
                    </button>
                    {/* Badge alert for size would be here if I could check image size */}
                  </>
                ) : (
                  <>
                    <Smartphone size={28} color="var(--muted)" />
                    <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>Enviar Ícone</span>
                  </>
                )}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px' }}>Ícone do atalho na tela inicial e splash screen</p>
              {iconSizeWarning && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#f59e0b', fontWeight: 700 }}>
                  <AlertTriangle size={10} /> ⚠️ Recomendado: 512×512px
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 5: BANNERS */}
      <div className="eng-card" style={{ marginBottom: '24px' }}>
        <div className="eng-card-header" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
              BANNERS
            </div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)' }}>
              {(pwaConfig.banners || []).length} / 3
            </div>
          </div>
        </div>
        <div className="eng-card-body" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
            {(pwaConfig.banners || []).map((banner) => (
              <div key={banner.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--surface2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ 
                  width: '100%', height: '56px', 
                  background: `linear-gradient(135deg, ${banner.colorA} 0%, ${banner.colorB} 100%)`, 
                  borderRadius: '8px', flexShrink: 0 
                }}></div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input 
                        type="color" 
                        value={banner.colorA} 
                        onChange={(e) => updateBanner(banner.id, { colorA: e.target.value })} 
                        style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer', outline: 'none', padding: 0 }} 
                      />
                      <input 
                        type="color" 
                        value={banner.colorB} 
                        onChange={(e) => updateBanner(banner.id, { colorB: e.target.value })} 
                        style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer', outline: 'none', padding: 0 }} 
                      />
                   </div>
                   
                   <div style={{ position: 'relative', flex: 1 }}>
                     <LinkIcon size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                     <input 
                        className="vpb-input" 
                        placeholder="Link (opcional)" 
                        style={{ marginBottom: 0, paddingLeft: '32px', fontSize: '12px', height: '36px' }}
                        value={banner.link}
                        onChange={(e) => updateBanner(banner.id, { link: e.target.value })}
                      />
                   </div>

                   <button 
                    className="icon-btn" 
                    onClick={() => removeBanner(banner.id)}
                    style={{ color: 'var(--muted)', padding: '8px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            className="btn-add-dashed" 
            onClick={addBanner}
            disabled={(pwaConfig.banners || []).length >= 3}
            style={{ 
              width: '100%', padding: '14px', border: '2px dashed var(--border)', borderRadius: '12px', 
              background: 'transparent', color: 'var(--muted)', opacity: (pwaConfig.banners || []).length >= 3 ? 0.5 : 1,
              cursor: (pwaConfig.banners || []).length >= 3 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: 700
            }}
          >
            <Plus size={16} /> NOVO BANNER
          </button>
        </div>
      </div>

      {/* SEÇÃO 6: AVANÇADO */}
      <div className="eng-card">
        <div className="eng-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
            AVANÇADO
          </div>
        </div>
        <div className="eng-card-body" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <label className="vpb-label">DESCRIÇÃO DO APP</label>
            <textarea 
              className="vpb-textarea" 
              placeholder="Descreva o que seu app oferece..." 
              style={{ minHeight: '100px' }}
              value={pwaConfig.description}
              onChange={(e) => updateConfig({ description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', background: 'var(--surface2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>Ocultar dos Motores de Busca</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Impede que seu app seja indexado pelo Google.</div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={pwaConfig.noIndex}
                onChange={() => updateConfig({ noIndex: !pwaConfig.noIndex })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          {pwaConfig.noIndex ? (
            <p style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>
              ⚠️ Ative apenas após o lançamento, se quiser acesso restrito.
            </p>
          ) : (
            <p style={{ fontSize: 11, color: 'var(--accent3)', marginTop: 4 }}>
              ✓ Seu app pode ser encontrado pelo Google.
            </p>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .upload-area:hover { border-color: var(--accent) !important; background: var(--accent-glow) !important; }
        .btn-add-dashed:hover:not(:disabled) { border-color: var(--accent) !important; color: var(--accent) !important; }
      `}} />
    </div>
  );
}

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Headset, MessageCircle, Mail, XCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function SupportConfig() {
  const pwaConfig = useAppStore(state => state.pwaConfig);
  const updatePwaConfig = useAppStore(state => state.updatePwaConfig);

  const updateConfig = (updates: Partial<typeof pwaConfig>) => {
    updatePwaConfig(updates);
  };

  return (
    <div className="eng-wrapper" style={{ animation: 'fadeIn 0.3s ease', paddingBottom: '80px' }}>
      <div className="section-header" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ padding: '8px', background: 'var(--accent-glow)', borderRadius: '10px', color: 'var(--accent)' }}>
            <Headset size={20} />
          </div>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Canais de Suporte</h2>
        </div>
        <p className="section-sub">Configure como seus alunos podem entrar em contato para tirar dúvidas.</p>
      </div>

      <div className="eng-card">
        <div className="eng-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
            CANAL DE CONTATO ATIVO
          </div>
        </div>
        <div className="eng-card-body" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <label className="vpb-label">TIPO DE SUPORTE</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <button 
                onClick={() => updateConfig({ supportConfig: { ...pwaConfig.supportConfig, type: 'none' } })}
                style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)',
                  background: pwaConfig.supportConfig?.type === 'none' ? 'var(--accent-glow)' : 'var(--surface2)',
                  borderColor: pwaConfig.supportConfig?.type === 'none' ? 'var(--accent)' : 'var(--border)',
                  color: pwaConfig.supportConfig?.type === 'none' ? 'var(--accent)' : 'var(--muted)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <XCircle size={20} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Desativado</span>
              </button>
              <button 
                onClick={() => updateConfig({ supportConfig: { ...pwaConfig.supportConfig, type: 'whatsapp' } })}
                style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)',
                  background: pwaConfig.supportConfig?.type === 'whatsapp' ? 'var(--accent-glow)' : 'var(--surface2)',
                  borderColor: pwaConfig.supportConfig?.type === 'whatsapp' ? 'var(--accent)' : 'var(--border)',
                  color: pwaConfig.supportConfig?.type === 'whatsapp' ? 'var(--accent)' : 'var(--muted)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <MessageCircle size={20} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>WhatsApp</span>
              </button>
              <button 
                onClick={() => updateConfig({ supportConfig: { ...pwaConfig.supportConfig, type: 'email' } })}
                style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)',
                  background: pwaConfig.supportConfig?.type === 'email' ? 'var(--accent-glow)' : 'var(--surface2)',
                  borderColor: pwaConfig.supportConfig?.type === 'email' ? 'var(--accent)' : 'var(--border)',
                  color: pwaConfig.supportConfig?.type === 'email' ? 'var(--accent)' : 'var(--muted)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Mail size={20} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>E-mail</span>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {pwaConfig.supportConfig?.type !== 'none' && (
              <motion.div 
                key={pwaConfig.supportConfig?.type}
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                  <label className="vpb-label">
                    {pwaConfig.supportConfig?.type === 'whatsapp' ? 'NÚMERO DO WHATSAPP' : 'ENDEREÇO DE E-MAIL'}
                  </label>
                  <input 
                    className="vpb-input" 
                    placeholder={pwaConfig.supportConfig?.type === 'whatsapp' ? 'Ex: 5511999999999' : 'Ex: suporte@seuapp.com'}
                    value={pwaConfig.supportConfig?.contact || ''}
                    onChange={(e) => updateConfig({ supportConfig: { ...pwaConfig.supportConfig, contact: e.target.value } })}
                  />
                  <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px' }}>
                    {pwaConfig.supportConfig?.type === 'whatsapp' 
                      ? 'Insira apenas números, incluindo o código do país (DDI) e o DDD.' 
                      : 'Este e-mail será exibido para o usuário copiar e entrar em contato.'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

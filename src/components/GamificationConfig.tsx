import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flame, Sparkles, BarChart, CircleDot, Target, Zap } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function GamificationConfig() {
  const pwaConfig = useAppStore(state => state.pwaConfig);
  const updatePwaConfig = useAppStore(state => state.updatePwaConfig);

  const updateGamification = (updates: Partial<typeof pwaConfig.gamification>) => {
    updatePwaConfig({
      gamification: {
        ...pwaConfig.gamification,
        ...updates
      }
    });
  };

  const progressOptions = [
    { id: 'none', label: 'Desativado', icon: <Target size={18} />, desc: 'Não exibe progresso' },
    { id: 'ring', label: 'Anel Circular', icon: <CircleDot size={18} />, desc: 'Indicador em arco' },
    { id: 'bar', label: 'Barra Linear', icon: <BarChart size={18} />, desc: 'Progresso horizontal' },
  ];

  return (
    <div className="eng-wrapper" style={{ animation: 'fadeIn 0.3s ease', paddingBottom: '80px' }}>
      <div className="section-header" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ padding: '8px', background: 'var(--accent-glow)', borderRadius: '10px', color: 'var(--accent)' }}>
            <Trophy size={20} />
          </div>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Motor de Gamificação</h2>
        </div>
        <p className="section-sub">Configure gatilhos de dopamina e retenção para manter seus alunos engajados todos os dias.</p>
      </div>

      {/* MASTER SWITCH */}
      <div className="eng-card" style={{ marginBottom: '24px', border: pwaConfig.gamification.enabled ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
        <div className="eng-card-body" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '14px', 
            background: pwaConfig.gamification.enabled ? 'var(--accent)' : 'var(--surface2)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: pwaConfig.gamification.enabled ? 'white' : 'var(--muted)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <Zap size={24} fill={pwaConfig.gamification.enabled ? 'white' : 'none'} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>Habilitar Motor de Gamificação</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>
              Ativa o sistema de recompensas, barras de progresso e ofensivas no aplicativo.
            </div>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={pwaConfig.gamification.enabled}
              onChange={() => updateGamification({ enabled: !pwaConfig.gamification.enabled })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <AnimatePresence>
        {pwaConfig.gamification.enabled && (
          <motion.div
            initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* PROGRESS STYLE */}
            <div className="eng-card" style={{ marginBottom: '24px' }}>
              <div className="eng-card-header">
                <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
                  ESTILO DE PROGRESSO (ZEIGARNIK)
                </div>
              </div>
              <div className="eng-card-body" style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {progressOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateGamification({ progressStyle: opt.id as any })}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)',
                        background: pwaConfig.gamification.progressStyle === opt.id ? 'var(--accent-glow)' : 'var(--surface2)',
                        borderColor: pwaConfig.gamification.progressStyle === opt.id ? 'var(--accent)' : 'var(--border)',
                        color: pwaConfig.gamification.progressStyle === opt.id ? 'var(--accent)' : 'var(--text)',
                        cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', textAlign: 'center'
                      }}
                    >
                      <div style={{ opacity: pwaConfig.gamification.progressStyle === opt.id ? 1 : 0.5 }}>{opt.icon}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>{opt.label}</span>
                        <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 400 }}>{opt.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* STREAKS */}
              <div className="eng-card">
                <div className="eng-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
                    <Flame size={14} /> SISTEMA DE OFENSIVAS
                  </div>
                </div>
                <div className="eng-card-body" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Ativar Streaks</span>
                    <label className="toggle-switch scale-75">
                      <input 
                        type="checkbox" 
                        checked={pwaConfig.gamification.enableStreaks}
                        onChange={() => updateGamification({ enableStreaks: !pwaConfig.gamification.enableStreaks })}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <AnimatePresence>
                    {pwaConfig.gamification.enableStreaks && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                          <label className="vpb-label">ÍCONE DA OFENSIVA</label>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input 
                              className="vpb-input" 
                              style={{ width: '60px', textAlign: 'center', fontSize: '24px', marginBottom: 0 }}
                              maxLength={2}
                              value={pwaConfig.gamification.streakIcon}
                              onChange={(e) => updateGamification({ streakIcon: e.target.value })}
                            />
                            <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.3 }}>
                              Emoji ou caractere que representa a persistência (Ex: 🔥, ⚡, 🎯).
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* CELEBRATION */}
              <div className="eng-card">
                <div className="eng-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
                    <Sparkles size={14} /> CELEBRAÇÃO (DOPAMINA)
                  </div>
                </div>
                <div className="eng-card-body" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ flex: 1, paddingRight: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, display: 'block' }}>Efeitos Visuais</span>
                      <span style={{ fontSize: '10px', color: 'var(--muted)', lineHeight: 1.2 }}>Dispara confetes ao concluir módulos.</span>
                    </div>
                    <label className="toggle-switch scale-75">
                      <input 
                        type="checkbox" 
                        checked={pwaConfig.gamification.enableCelebration}
                        onChange={() => updateGamification({ enableCelebration: !pwaConfig.gamification.enableCelebration })}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div style={{ 
                    marginTop: '16px', padding: '12px', background: 'var(--surface1)', borderRadius: '10px', 
                    border: '1px solid var(--border)', fontSize: '10px', color: 'var(--muted)', textAlign: 'center'
                  }}>
                    💡 Recompensas visuais imediatas aumentam a taxa de conclusão em até 40%.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .scale-75 { transform: scale(0.85); transform-origin: right; }
      `}} />
    </div>
  );
}

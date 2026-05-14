import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flame, Sparkles, BarChart, CircleDot, Target, Zap } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function GamificationConfig() {
  const pwaConfig = useAppStore(state => state.pwaConfig);
  const updatePwaConfig = useAppStore(state => state.updatePwaConfig);
  const modules = useAppStore(state => state.modules);

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

  const quickEmojis = ['🏆', '🥇', '⭐', '🔥', '💎', '👑', '🎯', '🚀', '🧠', '⚡', '💪', '🎉'];

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

            {/* ECONOMY & BADGES */}
            <div className="eng-card" style={{ marginTop: '24px', marginBottom: '24px' }}>
              <div className="eng-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
                  <Trophy size={14} /> ECONOMIA E CONQUISTAS
                </div>
              </div>
              <div className="eng-card-body" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, display: 'block' }}>Habilitar Sistema de Pontos e Medalhas</span>
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Recompense usuários com pontos e conquistas desbloqueáveis.</span>
                  </div>
                  <label className="toggle-switch scale-75">
                    <input 
                      type="checkbox" 
                      checked={pwaConfig.gamification.enablePoints}
                      onChange={() => updateGamification({ enablePoints: !pwaConfig.gamification.enablePoints, enableBadges: !pwaConfig.gamification.enablePoints })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <AnimatePresence>
                  {pwaConfig.gamification.enablePoints && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>Medalhas Configuradas</div>
                          <button 
                            className="btn-outline" 
                            style={{ padding: '6px 12px', fontSize: '11px', height: 'auto', borderRadius: '6px' }}
                            onClick={() => {
                              const newAward = { id: Date.now().toString(), title: 'Nova Medalha', icon: '🏆', points: 100, criteria: 'first_login' as const, criteriaValue: 0 };
                              updateGamification({ awardsConfig: [...(pwaConfig.gamification.awardsConfig || []), newAward] });
                            }}
                          >
                            + Adicionar Nova Medalha
                          </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {(!pwaConfig.gamification.awardsConfig || pwaConfig.gamification.awardsConfig.length === 0) ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)', fontSize: '12px', background: 'var(--surface1)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                              Nenhuma medalha configurada.
                            </div>
                          ) : (
                            pwaConfig.gamification.awardsConfig.map((award) => (
                              <div key={award.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '16px', background: 'var(--surface1)', borderRadius: '14px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                <div style={{ flex: 2 }}>
                                  <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', marginBottom: '4px', display: 'block' }}>TÍTULO</label>
                                  <input 
                                    className="vpb-input" 
                                    style={{ marginBottom: 0, fontSize: '13px', padding: '8px 12px' }}
                                    value={award.title}
                                    onChange={(e) => {
                                      const newAwards = pwaConfig.gamification.awardsConfig.map(a => a.id === award.id ? { ...a, title: e.target.value } : a);
                                      updateGamification({ awardsConfig: newAwards });
                                    }}
                                  />
                                </div>
                                <div style={{ flex: 1.5 }}>
                                  <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', marginBottom: '4px', display: 'block' }}>ÍCONE (EMOJI)</label>
                                  <input 
                                    className="vpb-input" 
                                    style={{ marginBottom: 0, fontSize: '18px', padding: '8px 12px', textAlign: 'center' }}
                                    value={award.icon}
                                    onChange={(e) => {
                                      const newAwards = pwaConfig.gamification.awardsConfig.map(a => a.id === award.id ? { ...a, icon: e.target.value } : a);
                                      updateGamification({ awardsConfig: newAwards });
                                    }}
                                  />
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                                    {quickEmojis.map(emoji => (
                                      <button
                                        key={emoji}
                                        onClick={() => {
                                          const newAwards = pwaConfig.gamification.awardsConfig.map(a => a.id === award.id ? { ...a, icon: emoji } : a);
                                          updateGamification({ awardsConfig: newAwards });
                                        }}
                                        style={{
                                          width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          borderRadius: '8px', background: 'var(--surface2)', cursor: 'pointer', border: 'none', fontSize: '16px',
                                          transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={(e) => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                  <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '8px', lineHeight: 1.3 }}>
                                    Clique para selecionar ou use (Win + .) no teclado.
                                  </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', marginBottom: '4px', display: 'block' }}>PONTOS</label>
                                  <input 
                                    type="number"
                                    className="vpb-input" 
                                    style={{ marginBottom: 0, fontSize: '13px', padding: '8px 12px' }}
                                    value={award.points}
                                    onChange={(e) => {
                                      const newAwards = pwaConfig.gamification.awardsConfig.map(a => a.id === award.id ? { ...a, points: parseInt(e.target.value) || 0 } : a);
                                      updateGamification({ awardsConfig: newAwards });
                                    }}
                                  />
                                </div>
                                <div style={{ flex: 2 }}>
                                  <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', marginBottom: '4px', display: 'block' }}>REGRA PARA DESBLOQUEIO</label>
                                  <select
                                    className="vpb-input"
                                    style={{ marginBottom: award.criteria === 'first_login' ? 0 : '8px', fontSize: '12px', padding: '8px', width: '100%' }}
                                    value={award.criteria}
                                    onChange={(e) => {
                                      const newAwards = pwaConfig.gamification.awardsConfig.map(a => a.id === award.id ? { ...a, criteria: e.target.value as any, criteriaValue: 0 } : a);
                                      updateGamification({ awardsConfig: newAwards });
                                    }}
                                  >
                                    <option value="first_login">Primeiro Acesso</option>
                                    <option value="lesson_count">Número de Aulas Concluídas</option>
                                    <option value="module_complete">Módulo Específico Concluído</option>
                                    <option value="streak_days">Ofensiva (Streak) de X Dias</option>
                                  </select>

                                  {award.criteria !== 'first_login' && (
                                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                                      <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', marginBottom: '4px', display: 'block' }}>
                                        {award.criteria === 'module_complete' ? 'MÓDULO ALVO' : 'VALOR NECESSÁRIO'}
                                      </label>
                                      {award.criteria === 'module_complete' ? (
                                        <select
                                          className="vpb-input"
                                          style={{ marginBottom: 0, fontSize: '12px', padding: '8px', width: '100%' }}
                                          value={award.criteriaValue}
                                          onChange={(e) => {
                                            const newAwards = pwaConfig.gamification.awardsConfig.map(a => a.id === award.id ? { ...a, criteriaValue: parseInt(e.target.value) || 0 } : a);
                                            updateGamification({ awardsConfig: newAwards });
                                          }}
                                        >
                                          <option value="">Selecione um módulo</option>
                                          {modules.map(mod => (
                                            <option key={mod.id} value={mod.id}>{mod.name}</option>
                                          ))}
                                        </select>
                                      ) : (
                                        <input
                                          type="number"
                                          className="vpb-input"
                                          style={{ marginBottom: 0, fontSize: '12px', padding: '8px', width: '100%' }}
                                          value={award.criteriaValue}
                                          onChange={(e) => {
                                            const newAwards = pwaConfig.gamification.awardsConfig.map(a => a.id === award.id ? { ...a, criteriaValue: parseInt(e.target.value) || 0 } : a);
                                            updateGamification({ awardsConfig: newAwards });
                                          }}
                                        />
                                      )}
                                    </motion.div>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
                                  <button 
                                    onClick={() => {
                                      const newAwards = pwaConfig.gamification.awardsConfig.filter(a => a.id !== award.id);
                                      updateGamification({ awardsConfig: newAwards });
                                    }}
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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

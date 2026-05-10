import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Users, Clock, Target, 
  Sparkles, CheckCircle2, Calendar, Rss, Star, GraduationCap,
  ChevronRight, BarChart, Info, Trophy, User as UserIcon
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function AnalyticsDashboard() {
  const modules = useAppStore(state => state.modules);
  const [gamificationActive, setGamificationActive] = useState(true);
  const [leaderboardActive, setLeaderboardActive] = useState(true);

  // Seeding functions for consistent mock data
  const getModuleViews = (id: number) => Math.floor(50 + ((id * 733) % 451));
  const getModuleCompletion = (id: number) => Math.floor(40 + ((id * 439) % 56));
  const getModuleFavorites = (id: number) => Math.floor(10 + ((id * 211) % 111));

  const getColorForPercent = (percent: number) => {
    // Basic interpolation between accent2 (#ff6b6b) and accent3 (#6bffb8)
    if (percent < 50) return 'var(--accent2)';
    if (percent < 80) return '#ffd166'; // Yellow middle
    return 'var(--accent3)';
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '60px' }}>
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 className="section-title">Analytics & Crescimento</h2>
          <p className="section-desc">Acompanhe como seus usuários interagem com o app.</p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px', 
        marginBottom: '32px' 
      }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Usuários Ativos</span>
            <div style={{ background: 'rgba(107,255,184,0.1)', color: 'var(--accent3)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>+12%</div>
          </div>
          <div style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: 800 }}>247</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>esta semana</div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Sessões Hoje</span>
            <div style={{ background: 'rgba(107,255,184,0.1)', color: 'var(--accent3)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>+5%</div>
          </div>
          <div style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: 800 }}>89</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>total de acessos</div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Consumo</span>
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--muted)' }}><Clock size={12} /></div>
          </div>
          <div style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: 800 }}>4.2h</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>média por usuário</div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Retenção</span>
            <div style={{ background: 'rgba(255,107,107,0.1)', color: 'var(--accent2)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>-3pp</div>
          </div>
          <div style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: 800 }}>73%</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>taxa média</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* ENGAJAMENTO POR MÓDULO */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BarChart size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Engajamento por Módulo</h3>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)', color: 'var(--muted)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px' }}>
                    <th style={{ padding: '12px 20px' }}>Módulo</th>
                    <th style={{ padding: '12px 20px' }}>Visualizações</th>
                    <th style={{ padding: '12px 20px' }}>Conclusão</th>
                    <th style={{ padding: '12px 20px' }}>Favoritos</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Nenhum módulo para analisar</td>
                    </tr>
                  ) : (
                    modules.map(mod => {
                      const views = getModuleViews(mod.id);
                      const completion = getModuleCompletion(mod.id);
                      const faves = getModuleFavorites(mod.id);
                      return (
                        <tr key={mod.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '16px 20px', fontWeight: 600 }}>{mod.name}</td>
                          <td style={{ padding: '16px 20px' }}>{views.toLocaleString()}</td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{completion}%</span>
                              <div style={{ width: '40px', height: '4px', background: 'var(--surface2)', borderRadius: '99px', overflow: 'hidden' }}>
                                <div style={{ width: `${completion}%`, height: '100%', background: getColorForPercent(completion) }}></div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>{faves}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* PROGRESS BARS OVERVIEW */}
            <div style={{ padding: '20px', background: 'var(--surface2)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>PROPORÇÃO DE CONCLUSÃO</div>
              <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', gap: '2px' }}>
                {modules.map(mod => {
                  const completion = getModuleCompletion(mod.id);
                  return (
                    <div 
                      key={mod.id} 
                      style={{ 
                        flex: 1, 
                        background: getColorForPercent(completion), 
                        opacity: 0.8 
                      }} 
                      title={`${mod.name}: ${completion}%`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* GAMIFICAÇÃO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'var(--accent-glow)', color: 'var(--accent)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trophy size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Sistema de Conquistas</h3>
                    <p style={{ fontSize: '12px', color: 'var(--muted)' }}>Engaje usuários com badges e recompensas.</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={gamificationActive} onChange={() => setGamificationActive(!gamificationActive)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {gamificationActive && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', animation: 'fadeIn 0.3s' }}>
                  {[
                    { name: 'Primeiro Acesso', icon: Sparkles, pts: 10, color: '#ffd166' },
                    { name: 'Módulo Completo', icon: CheckCircle2, pts: 50, color: '#6bffb8' },
                    { name: '7 Dias Seguidos', icon: Calendar, pts: 100, color: '#ff6b6b' },
                    { name: 'Compartilhou o App', icon: Rss, pts: 30, color: '#7c6fff' },
                    { name: 'Avaliou o App', icon: Star, pts: 20, color: '#06d6a0' },
                    { name: 'Top Estudante', icon: GraduationCap, pts: 200, color: '#118ab2' }
                  ].map((badge, idx) => (
                    <div key={idx} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ color: badge.color }}><badge.icon size={24} /></div>
                        <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)' }} />
                      </div>
                      <input 
                        defaultValue={badge.name} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '12px', fontWeight: 700, padding: 0 }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>Pontos</span>
                        <input 
                          type="number" 
                          defaultValue={badge.pts} 
                          style={{ width: '40px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '11px', padding: '2px 4px' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* PLACAR DE LÍDERES */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Placar de Líderes</h3>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={leaderboardActive} onChange={() => setLeaderboardActive(!leaderboardActive)} />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {leaderboardActive && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { pos: '🥇', name: 'Ana Silva', pts: 2450, color: '#6b8af0' },
                  { pos: '🥈', name: 'Marco Polo', pts: 2120, color: '#2dc4b6' },
                  { pos: '🥉', name: 'Julia Reis', pts: 1980, color: '#ff6b6b' },
                  { pos: '4', name: 'Carlos D.', pts: 1450, color: '#ffd166' },
                  { pos: '5', name: 'Luiza M.', pts: 1220, color: '#7c6fff' }
                ].map((user, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '12px', 
                    background: idx < 3 ? 'var(--accent-glow)' : 'transparent',
                    borderRadius: '10px',
                    border: idx < 3 ? '1px solid var(--accent)' : '1px solid transparent'
                  }}>
                    <div style={{ width: '24px', textAlign: 'center', fontSize: '14px', fontWeight: 800 }}>{user.pos}</div>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', color: 'white' }}>
                      {user.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, fontSize: '13px', fontWeight: 600 }}>{user.name}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>{user.pts} pts</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RETENÇÃO FUNNEL */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <Target size={18} style={{ color: 'var(--accent2)' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Funil de Retenção</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { label: 'Instalaram o app', val: 1240, pc: 100, op: 1 },
                { label: 'Completaram onboarding', val: 967, pc: 78, op: 0.8 },
                { label: 'Acessaram conteúdo', val: 756, pc: 61, op: 0.6 },
                { label: 'Compraram plano', val: 298, pc: 24, op: 0.4 }
              ].map((stage, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--muted)' }}>{stage.label}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ fontWeight: 700 }}>{stage.val.toLocaleString()}</span>
                      <span style={{ color: 'var(--muted)' }}>{stage.pc}%</span>
                    </div>
                  </div>
                  <div style={{ height: '32px', background: 'var(--surface2)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ 
                      position: 'absolute', 
                      left: 0, 
                      top: 0, 
                      bottom: 0, 
                      width: `${stage.pc}%`, 
                      background: 'var(--accent)', 
                      opacity: stage.op,
                      transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)' 
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--surface2)', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ color: 'var(--accent)', marginTop: '2px' }}><Info size={16} /></div>
              <p style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: '1.5' }}>
                O maior abandono ocorre no checkout (37%). Considere oferecer um cupom de desconto na primeira sessão para aumentar a conversão.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

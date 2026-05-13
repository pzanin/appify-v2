import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Users, Clock, Target, 
  ChevronRight, BarChart, Info, Trophy, User as UserIcon,
  Flame, PartyPopper, Monitor, Smartphone, Activity
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function AnalyticsDashboard() {
  const modules = useAppStore(state => state.modules);
  const analytics = useAppStore(state => state.analytics);
  const pwaConfig = useAppStore(state => state.pwaConfig);

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
          </div>
          <div style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: 800 }}>0</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>esta semana</div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Sessões Hoje</span>
          </div>
          <div style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: 800 }}>0</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>total de acessos</div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Consumo</span>
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--muted)' }}><Clock size={12} /></div>
          </div>
          <div style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: 800 }}>-</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>média por usuário</div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Retenção</span>
          </div>
          <div style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: 800 }}>-</div>
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

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* RETENÇÃO FUNNEL */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <Target size={18} style={{ color: 'var(--accent2)' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Funil de Retenção</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { label: 'Instalaram o app', val: 0, pc: 0, op: 1 },
                { label: 'Completaram onboarding', val: 0, pc: 0, op: 0.8 },
                { label: 'Acessaram conteúdo', val: 0, pc: 0, op: 0.6 },
                { label: 'Compraram plano', val: 0, pc: 0, op: 0.4 }
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

      {/* COMPORTAMENTO & CONVERSÃO */}
      <div style={{ marginTop: '48px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Comportamento & Conversão
          </h3>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '24px' 
        }}>
          {/* CARD 1: Funil de Upsell */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Target size={18} style={{ color: 'var(--accent)' }} />
              <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Funil de Upsell</h4>
            </div>
            
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 16px' }}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="var(--surface2)" strokeWidth="12" />
                  <circle cx="60" cy="60" r="54" fill="none" stroke="var(--accent)" strokeWidth="12" 
                    strokeDasharray={`${(analytics.upsellClicks.clicks / analytics.upsellClicks.total) * 339.29} 339.29`} 
                    strokeLinecap="round" transform="rotate(-90 60 60)" />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'Syne' }}>
                    {Math.round((analytics.upsellClicks.clicks / analytics.upsellClicks.total) * 100)}%
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 700 }}>INTERESSE</div>
                </div>
              </div>
              <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Taxa de Interesse em Ofertas</h5>
              <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
                <strong style={{ color: 'var(--text)' }}>{analytics.upsellClicks.clicks}</strong> cliques de <strong>{analytics.upsellClicks.total}</strong> visualizações em módulos trancados.
              </p>
            </div>
          </div>

          {/* CARD 2: Mapa de Drop-off */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <TrendingDown size={18} style={{ color: 'var(--accent2)' }} />
              <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Mapa de Drop-off</h4>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {analytics.dropOffByModule.map((item, idx) => {
                const isMax = item.rate === Math.max(...analytics.dropOffByModule.map(m => m.rate));
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                      <span style={{ color: isMax ? 'var(--accent2)' : 'var(--muted)', fontWeight: 700 }}>{item.rate}% evasão</span>
                    </div>
                    <div style={{ height: '10px', background: 'var(--surface2)', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${item.rate}%`, 
                        height: '100%', 
                        background: isMax ? 'var(--accent2)' : 'var(--accent)',
                        opacity: isMax ? 1 : 0.6,
                        transition: 'width 1s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255, 107, 107, 0.05)', border: '1px dashed rgba(255, 107, 107, 0.2)', borderRadius: '8px' }}>
              <p style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: '1.4' }}>
                O <span style={{ color: 'var(--accent2)', fontWeight: 700 }}>Módulo 3</span> apresenta a maior taxa de abandono. Verifique se o conteúdo está muito denso ou se há problemas técnicos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RETENÇÃO & ADOÇÃO */}
      <div style={{ marginTop: '48px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Retenção & Adoção
          </h3>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '24px' 
        }}>
          {/* CARD 3: Termômetro de Gamificação */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
              <Trophy size={18} style={{ color: '#ffd166' }} />
              <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Termômetro de Gamificação</h4>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--surface2)', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Média de Ofensiva</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'Syne', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {analytics.gamificationStats.activeStreaks}
                    <Flame size={20} style={{ color: '#ff6b6b' }} fill="#ff6b6b" />
                  </div>
                </div>
                <div style={{ color: 'var(--muted)', opacity: 0.5 }}><Activity size={24} /></div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--surface2)', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Total de Celebrações</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'Syne', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {analytics.gamificationStats.celebrationTriggers}
                    <PartyPopper size={20} style={{ color: pwaConfig.themeColor || 'var(--accent)' }} />
                  </div>
                </div>
                <div style={{ color: 'var(--muted)', opacity: 0.5 }}><Trophy size={24} /></div>
              </div>
            </div>
          </div>

          {/* CARD 4: Adoção do App */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <Smartphone size={18} style={{ color: pwaConfig.themeColor || 'var(--accent)' }} />
              <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Adoção do App</h4>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px', height: '160px' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface2)" strokeWidth="14" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke={pwaConfig.themeColor || 'var(--accent)'} strokeWidth="14" 
                    strokeDasharray={`${(analytics.pwaAdoption.installed / 100) * 314.159} 314.159`} 
                    strokeLinecap="round" transform="rotate(-90 60 60)" />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'Syne' }}>
                    {analytics.pwaAdoption.installed}%
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: pwaConfig.themeColor || 'var(--accent)' }}></div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 700 }}>APP INSTALADO</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {analytics.pwaAdoption.installed}% <Smartphone size={12} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--surface2)' }}></div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 700 }}>NAVEGADOR</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {analytics.pwaAdoption.web}% <Monitor size={12} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '20px', fontSize: '11px', color: 'var(--muted)', textAlign: 'center', padding: '8px', background: 'var(--surface2)', borderRadius: '8px' }}>
              A maioria dos usuários prefere a experiência instalada para acesso rápido.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

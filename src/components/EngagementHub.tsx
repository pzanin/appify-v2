import React, { useState } from 'react';
import { Bell, Send, Image as ImageIcon, Calendar, Rss, Users, User, Trash2, MessageSquare, Megaphone, LayoutGrid, Check, BarChart3, Settings, Pencil } from 'lucide-react';
import { ToastType } from '../types';

interface EngagementHubProps {
  showToast: (msg: string, type?: ToastType) => void;
}

interface Post {
  id: number;
  author: string;
  content: string;
  timestamp: string;
}

export function EngagementHub({ showToast }: EngagementHubProps) {
  const [activeTab, setActiveTab] = useState<'push' | 'feed' | 'community'>('push');
  
  // Push States
  const [pushTitle, setPushTitle] = useState('');
  const [pushMsg, setPushMsg] = useState('');
  const [pushImg, setPushImg] = useState('');
  const [pushDate, setPushDate] = useState('');
  const [pushHistoryTab, setPushHistoryTab] = useState<'history' | 'scheduled'>('history');

  // Feed States
  const [posts, setPosts] = useState<Post[]>([
    { id: 1, author: 'Admin', content: 'Bem-vindo ao app! 🎉', timestamp: 'Agora' }
  ]);
  const [authorName, setAuthorName] = useState('');
  const [postContent, setPostContent] = useState('');

  // Community States
  const [moderation, setModeration] = useState({
    approvePosts: true,
    allowComments: true,
    offensiveFilter: true
  });

  const handleSendPush = () => {
    if (!pushTitle || !pushMsg) {
      showToast('Preencha título e mensagem!', 'error');
      return;
    }
    showToast('Push agendado com sucesso!', 'success');
    setPushTitle('');
    setPushMsg('');
    setPushImg('');
    setPushDate('');
  };

  const handleCreatePost = () => {
    if (!authorName || !postContent) {
      showToast('Preencha autor e conteúdo!', 'error');
      return;
    }
    const newPost: Post = {
      id: Date.now(),
      author: authorName,
      content: postContent,
      timestamp: 'Agora'
    };
    setPosts([newPost, ...posts]);
    setAuthorName('');
    setPostContent('');
    showToast('Post publicado no feed!', 'success');
  };

  const handleDeletePost = (id: number) => {
    setPosts(posts.filter(p => p.id !== id));
    showToast('Post removido.', 'success');
  };

  return (
    <div className="eng-wrapper" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 className="section-title">Central de Engajamento</h2>
          <p className="section-sub">Comunique-se e interaja com seus usuários em tempo real.</p>
        </div>
      </div>

      <div className="eng-tabs" style={{ marginBottom: '24px', borderRadius: '12px' }}>
        <div 
          className={`eng-tab ${activeTab === 'push' ? 'active' : ''}`} 
          onClick={() => setActiveTab('push')}
        >
          <Megaphone size={16} /> 📣 Push
        </div>
        <div 
          className={`eng-tab ${activeTab === 'feed' ? 'active' : ''}`} 
          onClick={() => setActiveTab('feed')}
        >
          <Rss size={16} /> 📰 Feed
        </div>
        <div 
          className={`eng-tab ${activeTab === 'community' ? 'active' : ''}`} 
          onClick={() => setActiveTab('community')}
        >
          <Users size={16} /> 👥 Comunidade
        </div>
      </div>

      {activeTab === 'push' && (
        <div className="eng-layout">
          <div className="eng-card">
            <div className="eng-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <Send size={16} color="var(--accent)"/> Novo Push
              </div>
            </div>
            <div className="eng-card-body">
              <label className="vpb-label">TÍTULO DA NOTIFICAÇÃO</label>
              <input 
                className="vpb-input" 
                placeholder="Ex: Nova aula disponível!" 
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
              />
              
              <label className="vpb-label">MENSAGEM</label>
              <textarea 
                className="vpb-textarea" 
                placeholder="Escreva a mensagem..." 
                style={{ minHeight: '80px', marginBottom: '16px' }} 
                value={pushMsg}
                onChange={(e) => setPushMsg(e.target.value)}
              />
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label className="vpb-label">IMAGEM (URL OPCIONAL)</label>
                  <input 
                    className="vpb-input" 
                    placeholder="https://..." 
                    value={pushImg}
                    onChange={(e) => setPushImg(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="vpb-label">PROGRAMAR ENVIO</label>
                  <input 
                    type="datetime-local"
                    className="vpb-input" 
                    value={pushDate}
                    onChange={(e) => setPushDate(e.target.value)}
                  />
                </div>
              </div>
              
              <button className="btn-primary" style={{ width: '100%' }} onClick={handleSendPush}>
                <Send size={14}/> Disparar / Agendar
              </button>
            </div>
          </div>

          <div className="eng-card">
            <div className="eng-tabs">
              <div 
                className={`eng-tab ${pushHistoryTab === 'history' ? 'active' : ''}`}
                onClick={() => setPushHistoryTab('history')}
              >
                Histórico
              </div>
              <div 
                className={`eng-tab ${pushHistoryTab === 'scheduled' ? 'active' : ''}`}
                onClick={() => setPushHistoryTab('scheduled')}
              >
                Agendados
              </div>
            </div>
            <div className="eng-card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { titulo: 'Bem-vindo!', msg: 'Aproveite seu novo aplicativo.', tempo: 'Agora' },
                  { titulo: 'Novo conteúdo', msg: 'Sua aula de hoje está disponível.', tempo: '2h atrás' }
                ].map((item, idx) => (
                  <div key={idx} style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px' }}>{item.titulo}</div>
                      <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{item.tempo}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{item.msg}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'feed' && (
        <div className="eng-layout">
          <div className="eng-card">
            <div className="eng-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <Pencil size={16} color="var(--accent)"/> Criar Post
              </div>
            </div>
            <div className="eng-card-body">
              <label className="vpb-label">NOME DO AUTOR</label>
              <input 
                className="vpb-input" 
                placeholder="Ex: Admin" 
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
              
              <label className="vpb-label">CONTEÚDO DO POST</label>
              <textarea 
                className="vpb-textarea" 
                placeholder="Escreva algo..." 
                style={{ minHeight: '100px', marginBottom: '20px' }} 
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />
              
              <button className="btn-primary" style={{ width: '100%' }} onClick={handleCreatePost}>
                <MessageSquare size={16}/> Publicar no Feed
              </button>
            </div>
          </div>

          <div className="eng-card">
            <div className="eng-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <Rss size={16} color="var(--accent2)"/> Preview do Feed
              </div>
            </div>
            <div className="eng-card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {posts.map(post => (
                  <div key={post.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-glow)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                          {post.author[0]}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>{post.author}</div>
                      </div>
                      <button 
                        className="icon-btn delete-hover" 
                        onClick={() => handleDeletePost(post.id)}
                        style={{ color: 'var(--muted)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text)', paddingLeft: '42px' }}>
                      {post.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'community' && (
        <div className="eng-layout" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="eng-card">
            <div className="eng-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <Settings size={16} color="var(--accent)"/> Moderação
              </div>
            </div>
            <div className="eng-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '13px' }}>Aprovar posts antes de publicar</div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={moderation.approvePosts} 
                    onChange={() => setModeration({...moderation, approvePosts: !moderation.approvePosts})}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '13px' }}>Permitir comentários</div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={moderation.allowComments} 
                    onChange={() => setModeration({...moderation, allowComments: !moderation.allowComments})}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '13px' }}>Filtro de palavras ofensivas</div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={moderation.offensiveFilter} 
                    onChange={() => setModeration({...moderation, offensiveFilter: !moderation.offensiveFilter})}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="eng-card">
            <div className="eng-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <BarChart3 size={16} color="var(--accent3)"/> Estatísticas Mock
              </div>
            </div>
            <div className="eng-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                <div style={{ padding: '12px', background: 'var(--surface2)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)' }}>247</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Membros ativos</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--surface2)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)' }}>89</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Posts este mês</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--surface2)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)' }}>12</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Aguardando aprovação</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .delete-hover:hover { color: var(--accent2) !important; }
      `}} />
    </div>
  );
}

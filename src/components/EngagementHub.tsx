import React, { useState } from 'react';
import { Bell, Send, Image as ImageIcon, Calendar, Rss, Users, User, Trash2, MessageSquare, Megaphone, LayoutGrid, Check, BarChart3, Settings, Pencil, ImagePlus, X as XIcon, Plus, Hash, Zap, Ghost, Trash, UploadCloud } from 'lucide-react';
import { ToastType } from '../types';

interface EngagementHubProps {
  showToast: (msg: string, type?: ToastType) => void;
}

interface Post {
  id: number;
  author: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
}

export function EngagementHub({ showToast }: EngagementHubProps) {
  const [activeTab, setActiveTab] = useState<'push' | 'feed' | 'community'>('push');
  
  // Push States
  const [pushTitle, setPushTitle] = useState('');
  const [pushMsg, setPushMsg] = useState('');
  const [pushImg, setPushImg] = useState('');
  const [pushImgFile, setPushImgFile] = useState<File | null>(null);
  const [pushImgPreview, setPushImgPreview] = useState<string | null>(null);
  const [pushDate, setPushDate] = useState('');
  const [pushTarget, setPushTarget] = useState('all');
  const [pushAction, setPushAction] = useState('open_app');
  const [pushUrl, setPushUrl] = useState('');
  const [pushHistoryTab, setPushHistoryTab] = useState<'history' | 'scheduled'>('history');

  React.useEffect(() => {
    return () => {
      if (pushImgPreview && pushImgPreview.startsWith('blob:')) {
        URL.revokeObjectURL(pushImgPreview);
      }
    };
  }, [pushImgPreview]);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (pushImgPreview) URL.revokeObjectURL(pushImgPreview);
      setPushImgFile(file);
      setPushImgPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    if (pushImgPreview) URL.revokeObjectURL(pushImgPreview);
    setPushImgFile(null);
    setPushImgPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Feed States
  const [posts, setPosts] = useState<Post[]>([
    { id: 1, author: 'Admin', content: 'Bem-vindo ao app! 🎉', timestamp: 'Agora' }
  ]);
  const [authorName, setAuthorName] = useState('');
  const [postContent, setPostContent] = useState('');
  const [feedImageFile, setFeedImageFile] = useState<File | null>(null);
  const [feedImagePreview, setFeedImagePreview] = useState<string | null>(null);
  const [feedDate, setFeedDate] = useState('');
  
  const feedFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFeedFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('A imagem é muito grande (Máx: 2MB)', 'error');
        if (e.target) e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFeedImageFile(file);
        setFeedImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFeedImage = () => {
    setFeedImageFile(null);
    setFeedImagePreview(null);
    if (feedFileInputRef.current) feedFileInputRef.current.value = '';
  };

  // Community States
  const [moderation, setModeration] = useState({
    approvePosts: true,
    allowComments: true,
    offensiveFilter: true
  });
  const [badWords, setBadWords] = useState('');
  
  // Persona States
  const [personas, setPersonas] = useState<{id: number, name: string, avatar: string}[]>([]);
  const [newPersonaName, setNewPersonaName] = useState('');
  const [newPersonaAvatar, setNewPersonaAvatar] = useState('');

  const handleAddPersona = () => {
    if (!newPersonaName) {
      showToast('Nome é obrigatório!', 'error');
      return;
    }
    const newPersona = {
      id: Date.now(),
      name: newPersonaName,
      avatar: newPersonaAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(newPersonaName)}&background=random`
    };
    setPersonas([...personas, newPersona]);
    setNewPersonaName('');
    setNewPersonaAvatar('');
    showToast('Perfil semente criado!', 'success');
  };

  const handleDeletePersona = (id: number) => {
    setPersonas(personas.filter(p => p.id !== id));
    showToast('Perfil removido.', 'success');
  };

  const handlePersonaAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limite estrito de 2MB
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        showToast("A imagem é muito grande. O tamanho máximo permitido é 2MB.", 'error');
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPersonaAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendPush = () => {
    if (!pushTitle || !pushMsg) {
      showToast('Preencha título e mensagem!', 'error');
      return;
    }
    showToast('Push agendado com sucesso!', 'success');
    setPushTitle('');
    setPushMsg('');
    removeImage();
    setPushDate('');
    setPushTarget('all');
    setPushAction('open_app');
    setPushUrl('');
  };

  const handleCreatePost = () => {
    if (!authorName?.trim() || !postContent?.trim()) {
      showToast('Preencha autor e conteúdo!', 'error');
      return;
    }
    const newPost: Post = {
      id: Date.now(),
      author: authorName.trim(),
      content: postContent.trim(),
      imageUrl: feedImagePreview || undefined,
      timestamp: 'Agora'
    };
    setPosts([newPost, ...posts]);
    setAuthorName('');
    setPostContent('');
    setFeedImageFile(null);
    setFeedImagePreview(null);
    if (feedFileInputRef.current) feedFileInputRef.current.value = '';
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
          <Megaphone size={16} /> Push
        </div>
        <div 
          className={`eng-tab ${activeTab === 'feed' ? 'active' : ''}`} 
          onClick={() => setActiveTab('feed')}
        >
          <Rss size={16} /> Feed
        </div>
        <div 
          className={`eng-tab ${activeTab === 'community' ? 'active' : ''}`} 
          onClick={() => setActiveTab('community')}
        >
          <Users size={16} /> Comunidade
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
              <label className="vpb-label">PÚBLICO-ALVO</label>
              <select 
                className="vpb-input" 
                value={pushTarget}
                onChange={(e) => setPushTarget(e.target.value)}
                style={{ marginBottom: '16px' }}
              >
                <option value="all">Todos os Usuários</option>
                <option value="inactive_7">Usuários Inativos (7+ dias)</option>
                <option value="active_24">Usuários Ativos (Últimas 24h)</option>
              </select>

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
              
              <label className="vpb-label">AÇÃO AO CLICAR NO PUSH</label>
              <select 
                className="vpb-input" 
                value={pushAction}
                onChange={(e) => setPushAction(e.target.value)}
                style={{ marginBottom: pushAction === 'external_link' ? '8px' : '16px' }}
              >
                <option value="open_app">Apenas abrir o App</option>
                <option value="external_link">Redirecionar para um Link</option>
              </select>

              {pushAction === 'external_link' && (
                <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                  <input 
                    className="vpb-input" 
                    placeholder="https://..." 
                    value={pushUrl}
                    onChange={(e) => setPushUrl(e.target.value)}
                    style={{ marginBottom: '16px' }}
                  />
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="vpb-label">IMAGEM DA NOTIFICAÇÃO</label>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    hidden 
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    onChange={handleFileChange}
                  />

                  {pushImgPreview ? (
                    <div style={{ position: 'relative', width: '100%', height: '80px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={pushImgPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        onClick={removeImage}
                        style={{ 
                          position: 'absolute', top: '4px', right: '4px', 
                          background: 'rgba(255, 75, 75, 0.9)', color: 'white', 
                          border: 'none', borderRadius: '50%', width: '20px', height: '20px', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      >
                        <XIcon size={12} strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="group"
                      style={{ 
                        width: '100%', height: '80px', border: '1px dashed var(--border)', 
                        borderRadius: '10px', display: 'flex', flexDirection: 'column', 
                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        background: 'var(--surface2)', transition: 'all 0.2s'
                      }}
                    >
                      <ImagePlus size={20} className="text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors" />
                      <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', fontWeight: 600 }}>UPLOAD IMAGE</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="vpb-label">PROGRAMAR ENVIO</label>
                  <input 
                    type="datetime-local"
                    className="vpb-input" 
                    style={{ height: '80px', padding: '12px' }}
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
                style={{ minHeight: '100px', marginBottom: '12px' }} 
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />

              <div style={{ marginBottom: '20px' }}>
                <input 
                  type="file" 
                  ref={feedFileInputRef} 
                  hidden 
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  onChange={handleFeedFileChange}
                />
                
                {!feedImagePreview ? (
                  <button 
                    className="btn-ghost" 
                    style={{ width: '100%', borderStyle: 'dashed', gap: '10px', height: '44px' }}
                    onClick={() => feedFileInputRef.current?.click()}
                  >
                    <ImagePlus size={16} /> Adicionar Imagem
                  </button>
                ) : (
                  <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={feedImagePreview} alt="Preview" className="w-full aspect-square object-cover" />
                    <button 
                      onClick={removeFeedImage}
                      style={{ 
                        position: 'absolute', top: '8px', right: '8px', 
                        background: 'rgba(255, 75, 75, 0.9)', color: 'white', 
                        border: 'none', borderRadius: '50%', width: '24px', height: '24px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                      }}
                    >
                      <XIcon size={14} strokeWidth={3} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="vpb-label">AGENDAR PUBLICAÇÃO (OPCIONAL)</label>
                <input 
                  type="datetime-local"
                  className="vpb-input" 
                  style={{ marginBottom: '4px' }}
                  value={feedDate}
                  onChange={(e) => setFeedDate(e.target.value)}
                />
                <p style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>
                  Deixe em branco para publicar imediatamente.
                </p>
              </div>
              
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
                          {post.author?.[0] || '?'}
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
                    <div style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text)', paddingLeft: '42px', marginBottom: post.imageUrl ? '12px' : 0 }}>
                      {post.content}
                    </div>
                    {post.imageUrl && (
                      <div style={{ paddingLeft: '42px' }}>
                        <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                          <img src={post.imageUrl} alt="Post content" className="w-full aspect-square object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'community' && (
        <div className="eng-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* CARD DE MODERAÇÃO */}
            <div className="eng-card">
              <div className="eng-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  <Settings size={16} color="var(--accent)"/> Moderação de Comunidade
                </div>
              </div>
              <div className="eng-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>Aprovar posts antes de publicar</div>
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
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>Permitir comentários nos posts</div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={moderation.allowComments} 
                      onChange={() => setModeration({...moderation, allowComments: !moderation.allowComments})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>Filtro de palavras ofensivas</div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={moderation.offensiveFilter} 
                        onChange={() => setModeration({...moderation, offensiveFilter: !moderation.offensiveFilter})}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  
                  {moderation.offensiveFilter && (
                    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                      <textarea 
                        className="vpb-textarea"
                        placeholder="Digite as palavras proibidas separadas por vírgula (ex: lixo, idiota, spam)..."
                        value={badWords}
                        onChange={(e) => setBadWords(e.target.value)}
                        style={{ 
                          minHeight: '100px', 
                          fontSize: '13px',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          background: 'var(--surface2)',
                          width: '100%'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PASSO 1: O CARD DE PERFIS SEMENTE */}
            <div className="eng-card">
              <div className="eng-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  <Users size={16} color="var(--accent3)"/> Perfis Semente (Ghost Mode)
                </div>
              </div>
              <div className="eng-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>
                  Crie membros virtuais para movimentar a comunidade e gerar o efeito manada inicial.
                </p>

                {/* PASSO 2: CRIAÇÃO DE PERSONAS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label className="vpb-label">Nome do Membro (ex: João Silva)</label>
                    <input 
                      className="vpb-input" 
                      placeholder="Nome completo ou apelido"
                      value={newPersonaName}
                      onChange={(e) => setNewPersonaName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2 mb-4">
                    <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Foto de Perfil (Avatar)
                    </label>
                    <label className="border-2 border-dashed border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-[#6338F6] hover:bg-[#6338F6]/5 transition-colors group">
                      {newPersonaAvatar ? (
                        <div style={{ position: 'relative', width: '48px', height: '48px', marginBottom: '8px' }}>
                           <img src={newPersonaAvatar} alt="Preview" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                           <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0 }} className="group-hover:opacity-100 transition-opacity">
                              <UploadCloud className="w-4 h-4 text-white" />
                           </div>
                        </div>
                      ) : (
                        <UploadCloud className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[#6338F6] mb-2" />
                      )}
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {newPersonaAvatar ? 'Alterar foto' : 'Clique para enviar foto'}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] mt-1">JPG, PNG (Máx: 2MB)</span>
                      <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handlePersonaAvatarChange} />
                    </label>
                  </div>
                  <button className="btn-primary" style={{ width: '100%' }} onClick={handleAddPersona}>
                    <Plus size={14} /> Criar Perfil
                  </button>
                </div>

                {/* PASSO 3: LISTA DE PERSONAS ATIVAS */}
                {personas.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <label className="vpb-label" style={{ marginBottom: '12px' }}>PERSONAS ATIVAS</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                      {personas.map(p => (
                        <div key={p.id} style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', position: 'relative' }}>
                          <img src={p.avatar} alt={p.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                          <span style={{ fontSize: '10px', fontWeight: 600, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', whiteSpace: 'nowrap' }}>
                            {p.name.split(' ')[0]}
                          </span>
                          <button 
                            onClick={() => handleDeletePersona(p.id)}
                            style={{ position: 'absolute', top: '2px', right: '2px', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '2px' }}
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PASSO 4: NOTA ESTRATÉGICA */}
                <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(124, 111, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(124, 111, 255, 0.1)' }}>
                  <p style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
                    <strong>Dica:</strong> Ao acessar o painel de moderação da comunidade, você poderá selecionar no dropdown "Postar como..." qualquer um destes perfis para iniciar discussões.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="eng-card" style={{ height: 'fit-content' }}>
             <div className="eng-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  <BarChart3 size={16} color="var(--accent2)"/> Estatísticas da Comunidade
                </div>
              </div>
              <div className="eng-card-body">
                 <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--muted)' }}>
                    <LayoutGrid size={32} style={{ marginBottom: '16px', opacity: 0.2 }} />
                    <p style={{ fontSize: '13px' }}>As estatísticas detalhadas de engajamento aparecerão aqui após os primeiros posts.</p>
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

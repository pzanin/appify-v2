import React, { useState } from 'react';
import { 
  Settings, Trash2, Layers, Plus, GripVertical, Pencil, Eye, 
  MoreHorizontal, Copy, Edit2, Move, ChevronRight, X, Check, BookOpen
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { projectService } from '../services/projectService';
import { RenderDynamicIcon } from './RenderDynamicIcon';
import { ICON_MAP } from '../constants';

interface ModuleDetailProps { handleDeleteModule: (id: number) => void; handleDeleteSubmodule: (modId: number, subId: number) => void; handleAddSubmodule: (modId: number) => void; }
export function ModuleDetail({ handleDeleteModule, handleDeleteSubmodule, handleAddSubmodule }: ModuleDetailProps) {
  const modules = useAppStore(state => state.modules);
  const selectedModuleId = useAppStore(state => state.selectedModuleId);
  
  const renameModule = useAppStore(state => state.renameModule);
  const toggleModuleStatus = useAppStore(state => state.toggleModuleStatus);
  const setModuleIcon = useAppStore(state => state.setModuleIcon);
  const renameSubmodule = useAppStore(state => state.renameSubmodule);
  const duplicateSubmodule = useAppStore(state => state.duplicateSubmodule);
  const moveSubmodule = useAppStore(state => state.moveSubmodule);
  const reorderSubmodule = useAppStore(state => state.reorderSubmodule);
  const setEditingSubmodule = useAppStore(state => state.setEditingSubmodule);

  const selectedModule = modules.find(m => m.id === selectedModuleId);
  
  const [draggedSubId, setDraggedSubId] = useState<number | null>(null);
  const [dragOverSubId, setDragOverSubId] = useState<number | null>(null);
  
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  const [showConfig, setShowConfig] = useState(false);
  const [isRenamingModule, setIsRenamingModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [showIconGrid, setShowIconGrid] = useState(false);

  const dropdownItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px 12px',
    fontSize: '12px',
    color: 'var(--text)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.2s',
  };

  if (!selectedModule) return null;

  const onDragStart = (e: React.DragEvent, subId: number) => { setDraggedSubId(subId); e.dataTransfer.effectAllowed = "move"; };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDragEnter = (subId: number) => setDragOverSubId(subId);
  const onDrop = () => {
    if (draggedSubId !== null && dragOverSubId !== null && draggedSubId !== dragOverSubId && selectedModuleId !== null) {
      reorderSubmodule({ modId: selectedModuleId, dragId: draggedSubId, overId: dragOverSubId });
    } setDraggedSubId(null); setDragOverSubId(null);
  };

  return (
    <div className="module-detail">
      <div className="module-detail-header">
        <div className="module-card-icon" style={{width: '32px', height: '32px', fontSize: '16px', borderRadius: '8px', marginBottom: 0, border: 'none', background: 'transparent'}}>
          <RenderDynamicIcon name={selectedModule.iconName} size={16} />
        </div>
        <div>
          {isRenamingModule ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                className="vpb-input" 
                style={{ marginBottom: 0, padding: '4px 8px', height: '28px', fontSize: '14px', width: '200px' }}
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
                onBlur={() => {
                  if (newModuleName.trim() && newModuleName !== selectedModule.name) {
                    renameModule({ id: selectedModule.id, name: newModuleName.trim() });
                  }
                  setIsRenamingModule(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (newModuleName.trim() && newModuleName !== selectedModule.name) {
                      renameModule({ id: selectedModule.id, name: newModuleName.trim() });
                    }
                    setIsRenamingModule(false);
                  } else if (e.key === 'Escape') {
                    setIsRenamingModule(false);
                  }
                }}
                autoFocus
              />
            </div>
          ) : (
            <div style={{fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 700}}>{selectedModule.name}</div>
          )}
          <div style={{fontSize: '12px', color: 'var(--muted)'}}>Módulo raiz · {selectedModule.subs.length} sub-módulos</div>
        </div>
        <div style={{marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center', position: 'relative'}}>
          <span className={`card-badge ${selectedModule.status === 'Ativo' ? 'badge-ok' : 'badge-ai'}`}>{selectedModule.status}</span>
          
          <button 
            className="btn-ghost" 
            onClick={() => setShowConfig(!showConfig)} 
            style={{fontSize: '12px'}}
          >
            <Settings size={14} /> Config
          </button>

          {showConfig && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => { setShowConfig(false); setShowIconGrid(false); }} />
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                zIndex: 101,
                minWidth: '220px',
                padding: '8px',
                animation: 'slideInY 0.2s ease-out'
              }}>
                <button 
                  className="dropdown-item" 
                  style={dropdownItemStyle} 
                  onClick={() => {
                    setNewModuleName(selectedModule.name);
                    setIsRenamingModule(true);
                    setShowConfig(false);
                  }}
                >
                  <Edit2 size={12} /> Renomear módulo
                </button>

                <button 
                  className="dropdown-item" 
                  style={dropdownItemStyle} 
                  onClick={() => {
                    toggleModuleStatus(selectedModule.id);
                    setShowConfig(false);
                  }}
                >
                  <Eye size={12} /> {selectedModule.status === 'Ativo' ? 'Marcar como Rascunho' : 'Marcar como Ativo'}
                </button>

                <div style={{ position: 'relative' }}>
                  <button 
                    className="dropdown-item" 
                    style={{ ...dropdownItemStyle, justifyContent: 'space-between' }} 
                    onClick={() => setShowIconGrid(!showIconGrid)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={12} /> Alterar Capa (Imagem) / Link
                    </div>
                    <ChevronRight size={12} />
                  </button>
                  
                  {showIconGrid && (
                    <div style={{
                      position: 'absolute',
                      right: '100%',
                      top: 0,
                      marginRight: '8px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '10px',
                      width: '200px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: '4px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}>
                      {Object.keys(ICON_MAP).map(iconName => (
                        <button
                          key={iconName}
                          onClick={() => {
                            setModuleIcon({ id: selectedModule.id, iconName });
                            setShowIconGrid(false);
                            setShowConfig(false);
                          }}
                          style={{
                            padding: '6px',
                            borderRadius: '4px',
                            background: selectedModule.iconName === iconName ? 'var(--accent)' : 'transparent',
                            color: selectedModule.iconName === iconName ? 'white' : 'var(--text)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <RenderDynamicIcon name={iconName} size={16} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                
                <button 
                  className="dropdown-item" 
                  style={{ ...dropdownItemStyle, color: 'var(--accent2)' }} 
                  onClick={() => {
                    handleDeleteModule(selectedModule.id);
                    setShowConfig(false);
                  }}
                >
                  <Trash2 size={12} /> Deletar módulo
                </button>
              </div>
            </>
          )}

          <button className="btn-ghost" style={{fontSize: '12px', padding: '6px', color: 'var(--accent2)', borderColor: 'transparent'}} onClick={() => handleDeleteModule(selectedModule.id)} title="Deletar Módulo"><Trash2 size={16} /></button>
        </div>
      </div>
      <div className="module-detail-tabs">
        <div className="detail-tab active">Sub-módulos</div>
        <div className="detail-tab">Conteúdo HTML</div>
      </div>
      
      <div className="module-detail-body" style={{ paddingBottom: '160px' }}>
        {selectedModule.subs.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 20px', background: 'transparent', borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="empty-state-icon" style={{ width: '56px', height: '56px', marginBottom: '12px' }}><Layers size={24} /></div>
            <h3 className="empty-state-title" style={{ fontSize: '15px' }}>Módulo sem conteúdo</h3>
            <p className="empty-state-desc" style={{ marginBottom: '16px' }}>Enriqueça este módulo com aulas, páginas em HTML nativo ou materiais para download.</p>
            <button className="btn-primary" style={{ padding: '8px 20px' }} onClick={() => handleAddSubmodule(selectedModuleId!)}><Plus size={16} /> Adicionar Primeiro Sub-módulo</button>
          </div>
        ) : (
          <>
            <div className="submodule-list">
              {selectedModule.subs.map(sub => (
                <div key={sub.id} className={`submodule-item ${draggedSubId === sub.id ? 'dragging' : ''} ${dragOverSubId === sub.id && draggedSubId !== sub.id ? 'drag-over' : ''}`} draggable onDragStart={(e) => onDragStart(e, sub.id)} onDragOver={onDragOver} onDragEnter={(e) => onDragEnter(sub.id)} onDragEnd={onDrop}>
                  <GripVertical size={14} className="drag-handle" />
                  {renamingId === sub.id ? (
                    <input 
                      className="vpb-input" 
                      style={{ marginBottom: 0, padding: '2px 8px', height: '24px', fontSize: '13px', flex: 1 }}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => {
                        if (renameValue.trim() && renameValue !== sub.name) {
                          renameSubmodule({ modId: selectedModule.id, subId: sub.id, name: renameValue.trim() });
                        }
                        setRenamingId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (renameValue.trim() && renameValue !== sub.name) {
                            renameSubmodule({ modId: selectedModule.id, subId: sub.id, name: renameValue.trim() });
                          }
                          setRenamingId(null);
                        } else if (e.key === 'Escape') {
                          setRenamingId(null);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className="submodule-name">{sub.name}</span>
                  )}
                  {(() => {
                    const hasData = (sub.content_html && sub.content_html.trim().length > 0) || (sub.builder_data && sub.builder_data.length > 0);
                    return (
                      <span className="submodule-type" style={hasData ? { color: 'var(--step-done)', background: 'rgba(107,255,184,0.1)' } : {}}>
                        {sub.type}
                      </span>
                    );
                  })()}
                  <div className="submodule-actions">
                    <button className="icon-btn" title="Editar Conteúdo Visualmente" onClick={() => setEditingSubmodule({ modId: selectedModule.id, subId: sub.id })}><Pencil size={14} /></button>
                    <button className="icon-btn" title="Visualizar/Editar" onClick={() => setEditingSubmodule({ modId: selectedModule.id, subId: sub.id })}><Eye size={14} /></button>
                    <div style={{ position: 'relative' }}>
                      <button 
                        className="icon-btn" 
                        title="Mais opções" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === sub.id ? null : sub.id);
                        }}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      
                      {openDropdownId === sub.id && (
                        <>
                          <div 
                            style={{ position: 'fixed', inset: 0, zIndex: 10 }} 
                            onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '4px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                            zIndex: 11,
                            minWidth: '180px',
                            overflow: 'visible'
                          }}>
                            <button 
                              className="dropdown-item" 
                              style={dropdownItemStyle} 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setRenameValue(sub.name);
                                setRenamingId(sub.id);
                                setOpenDropdownId(null); 
                              }}
                            >
                              <Edit2 size={12} /> Renomear
                            </button>
                            <button 
                              className="dropdown-item" 
                              style={dropdownItemStyle} 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                duplicateSubmodule({ modId: selectedModule.id, subId: sub.id });
                                setOpenDropdownId(null); 
                              }}
                            >
                              <Copy size={12} /> Duplicar
                            </button>
                            
                            <div style={{ position: 'relative' }}>
                              <button 
                                className="dropdown-item" 
                                style={{ ...dropdownItemStyle, justifyContent: 'space-between' }} 
                                onClick={(e) => { e.stopPropagation(); }}
                                onMouseEnter={(e) => { /* Show sub menu could be handled here or by showing on click */ }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Move size={12} /> Mover para
                                </div>
                                <ChevronRight size={12} />
                                
                                <div className="sub-menu" style={{
                                  position: 'absolute',
                                  left: '100%',
                                  top: 0,
                                  background: 'var(--surface)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '8px',
                                  minWidth: '160px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                  display: 'none', // Hidden by default, shown on parent hover
                                  padding: '4px'
                                }}>
                                  {modules.filter(m => m.id !== selectedModule.id).map(targetMod => (
                                    <button
                                      key={targetMod.id}
                                      className="dropdown-item"
                                      style={dropdownItemStyle}
                                      onClick={() => {
                                        moveSubmodule({ fromModId: selectedModule.id, subId: sub.id, toModId: targetMod.id });
                                        setOpenDropdownId(null);
                                      }}
                                    >
                                      {targetMod.name}
                                    </button>
                                  ))}
                                  {modules.length === 1 && (
                                    <div style={{ padding: '8px', fontSize: '10px', color: 'var(--muted)' }}>Nenhum outro módulo</div>
                                  )}
                                </div>
                                <style>{`
                                  .dropdown-item:hover .sub-menu { display: block !important; }
                                `}</style>
                              </button>
                            </div>
                            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                            <button 
                              className="dropdown-item" 
                              style={{ ...dropdownItemStyle, color: 'var(--accent2)' }} 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSubmodule(selectedModuleId!, sub.id);
                                setOpenDropdownId(null);
                              }}
                            >
                              <Trash2 size={12} /> Deletar
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop: '12px'}}>
              <button className="add-module-btn" onClick={() => handleAddSubmodule(selectedModuleId!)} style={{minHeight: '48px', flexDirection: 'row', gap: '8px', padding: '12px', width: 'fit-content'}}><Plus size={18} /><span>Adicionar Sub-módulo</span></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

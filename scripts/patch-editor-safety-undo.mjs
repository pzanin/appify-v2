import fs from 'node:fs';

const file = 'src/components/ModulesAndContent.tsx';
let source = fs.readFileSync(file, 'utf8');

function replaceExact(before, after, label) {
  if (!source.includes(before)) {
    throw new Error(`Patch marker not found: ${label}`);
  }
  source = source.replace(before, after);
}

replaceExact(
  `  SeparatorHorizontal, Trash2, Layers, Video, Globe, Code, Upload, Eye, ArrowUp, ArrowDown, Copy\n} from 'lucide-react';`,
  `  SeparatorHorizontal, Trash2, Layers, Video, Globe, Code, Upload, Eye, ArrowUp, ArrowDown, Copy, Undo2, Redo2\n} from 'lucide-react';`,
  'lucide undo/redo icons'
);

replaceExact(
  `interface ModulesAndContentProps {\n  submodule: SubModule;\n  onSave: (html: string, builderData: BuilderBlock[], htmlMode?: 'visual' | 'code') => void;\n  onClose: () => void;\n}\n\n\nexport function ModulesAndContent`,
  `interface ModulesAndContentProps {\n  submodule: SubModule;\n  onSave: (html: string, builderData: BuilderBlock[], htmlMode?: 'visual' | 'code') => void;\n  onClose: () => void;\n}\n\nconst cloneBuilderBlocks = (items: BuilderBlock[]) =>\n  items.map(block => ({ ...block, props: { ...block.props } }));\n\nconst editorDraftSnapshot = (value: {\n  submoduleName: string;\n  blocks: BuilderBlock[];\n  viewMode: 'visual' | 'code';\n  contentType: 'web' | 'html' | 'youtube' | 'vimeo' | 'panda';\n  contentUrl: string;\n  contentHtml: string;\n  htmlInteractive: boolean;\n  hasCustomHtml: boolean;\n  timeGateSeconds: number;\n  enableCelebration: boolean;\n}) => JSON.stringify(value);\n\nexport function ModulesAndContent`,
  'editor helpers'
);

replaceExact(
  `  const [timeGateSeconds, setTimeGateSeconds] = useState(submodule.gamificationConfig?.timeGateSeconds || 0);\n  const [enableCelebration, setEnableCelebration] = useState(submodule.gamificationConfig?.enableCelebration ?? true);\n\n  // Sync state with submodule prop when it changes`,
  `  const [timeGateSeconds, setTimeGateSeconds] = useState(submodule.gamificationConfig?.timeGateSeconds || 0);\n  const [enableCelebration, setEnableCelebration] = useState(submodule.gamificationConfig?.enableCelebration ?? true);\n\n  const historyPastRef = useRef<BuilderBlock[][]>([]);\n  const historyFutureRef = useRef<BuilderBlock[][]>([]);\n  const previousBlocksRef = useRef<BuilderBlock[]>(cloneBuilderBlocks(submodule.builder_data || []));\n  const historyActionRef = useRef<'normal' | 'undo' | 'redo' | 'sync'>('sync');\n  const [historyVersion, setHistoryVersion] = useState(0);\n  const baselineSnapshotRef = useRef(editorDraftSnapshot({\n    submoduleName: submodule.name || '',\n    blocks: submodule.builder_data || [],\n    viewMode: submodule.htmlMode || 'visual',\n    contentType: submodule.contentType || 'html',\n    contentUrl: submodule.contentUrl || '',\n    contentHtml: submodule.customHtml || (submodule.htmlMode === 'code' ? submodule.contentHtml || submodule.content_html || '' : ''),\n    htmlInteractive: submodule.htmlInteractive === true,\n    hasCustomHtml: Boolean(submodule.customHtml || submodule.htmlMode === 'code'),\n    timeGateSeconds: submodule.gamificationConfig?.timeGateSeconds || 0,\n    enableCelebration: submodule.gamificationConfig?.enableCelebration ?? true\n  }));\n\n  const getCurrentDraftSnapshot = () => editorDraftSnapshot({\n    submoduleName,\n    blocks,\n    viewMode,\n    contentType,\n    contentUrl,\n    contentHtml,\n    htmlInteractive,\n    hasCustomHtml,\n    timeGateSeconds,\n    enableCelebration\n  });\n\n  const requestClose = () => {\n    const hasUnsavedChanges = baselineSnapshotRef.current !== getCurrentDraftSnapshot();\n    if (hasUnsavedChanges) {\n      const shouldDiscard = window.confirm(\n        'Existem alterações não salvas nesta aula.\\n\\nSe sair agora, essas alterações serão perdidas. Deseja sair mesmo assim?'\n      );\n      if (!shouldDiscard) return;\n    }\n    onClose();\n  };\n\n  // Sync state with submodule prop when it changes`,
  'history refs and dirty snapshot'
);

replaceExact(
  `  React.useEffect(() => {\n    setSubmoduleName(submodule.name || '');\n    setBlocks(submodule.builder_data || []);`,
  `  React.useEffect(() => {\n    historyPastRef.current = [];\n    historyFutureRef.current = [];\n    previousBlocksRef.current = cloneBuilderBlocks(submodule.builder_data || []);\n    historyActionRef.current = 'sync';\n    baselineSnapshotRef.current = editorDraftSnapshot({\n      submoduleName: submodule.name || '',\n      blocks: submodule.builder_data || [],\n      viewMode: submodule.htmlMode || 'visual',\n      contentType: submodule.contentType || 'html',\n      contentUrl: submodule.contentUrl || '',\n      contentHtml: submodule.customHtml || (submodule.htmlMode === 'code' ? submodule.contentHtml || submodule.content_html || '' : ''),\n      htmlInteractive: submodule.htmlInteractive === true,\n      hasCustomHtml: Boolean(submodule.customHtml || submodule.htmlMode === 'code'),\n      timeGateSeconds: submodule.gamificationConfig?.timeGateSeconds || 0,\n      enableCelebration: submodule.gamificationConfig?.enableCelebration ?? true\n    });\n    setHistoryVersion(version => version + 1);\n    setSubmoduleName(submodule.name || '');\n    setBlocks(submodule.builder_data || []);`,
  'reset editor history when lesson changes'
);

replaceExact(
  `  }, [submodule]);\n\n  const handleSave = () => {`,
  `  }, [submodule]);\n\n  React.useEffect(() => {\n    const previous = previousBlocksRef.current;\n    const next = cloneBuilderBlocks(blocks);\n\n    if (historyActionRef.current === 'sync') {\n      previousBlocksRef.current = next;\n      historyActionRef.current = 'normal';\n      return;\n    }\n\n    if (JSON.stringify(previous) === JSON.stringify(next)) return;\n\n    if (historyActionRef.current === 'undo' || historyActionRef.current === 'redo') {\n      previousBlocksRef.current = next;\n      historyActionRef.current = 'normal';\n      setHistoryVersion(version => version + 1);\n      return;\n    }\n\n    historyPastRef.current = [...historyPastRef.current.slice(-49), cloneBuilderBlocks(previous)];\n    historyFutureRef.current = [];\n    previousBlocksRef.current = next;\n    setHistoryVersion(version => version + 1);\n  }, [blocks]);\n\n  React.useEffect(() => {\n    const handleBeforeUnload = (event: BeforeUnloadEvent) => {\n      if (baselineSnapshotRef.current === getCurrentDraftSnapshot()) return;\n      event.preventDefault();\n      event.returnValue = '';\n    };\n    window.addEventListener('beforeunload', handleBeforeUnload);\n    return () => window.removeEventListener('beforeunload', handleBeforeUnload);\n  });\n\n  const handleSave = () => {`,
  'history observer and unload protection'
);

replaceExact(
  `      onSave(finalHtml, finalBlocks, contentType === 'html' ? viewMode : undefined);`,
  `      baselineSnapshotRef.current = getCurrentDraftSnapshot();\n      onSave(finalHtml, finalBlocks, contentType === 'html' ? viewMode : undefined);`,
  'save baseline'
);

replaceExact(
  `  const deleteBlock = (id: string) => { setBlocks(current => current.filter(b => b.id !== id)); if (selectedBlockId === id) setSelectedBlockId(null); };\n\n  const rememberRichTextSelection`,
  `  const deleteBlock = (id: string) => { setBlocks(current => current.filter(b => b.id !== id)); if (selectedBlockId === id) setSelectedBlockId(null); };\n\n  const undoBlocks = () => {\n    const previous = historyPastRef.current.at(-1);\n    if (!previous) return;\n    historyPastRef.current = historyPastRef.current.slice(0, -1);\n    historyFutureRef.current = [...historyFutureRef.current.slice(-49), cloneBuilderBlocks(blocks)];\n    historyActionRef.current = 'undo';\n    const restored = cloneBuilderBlocks(previous);\n    setBlocks(restored);\n    setSelectedBlockId(current => current && restored.some(block => block.id === current) ? current : null);\n    setHistoryVersion(version => version + 1);\n  };\n\n  const redoBlocks = () => {\n    const next = historyFutureRef.current.at(-1);\n    if (!next) return;\n    historyFutureRef.current = historyFutureRef.current.slice(0, -1);\n    historyPastRef.current = [...historyPastRef.current.slice(-49), cloneBuilderBlocks(blocks)];\n    historyActionRef.current = 'redo';\n    const restored = cloneBuilderBlocks(next);\n    setBlocks(restored);\n    setSelectedBlockId(current => current && restored.some(block => block.id === current) ? current : null);\n    setHistoryVersion(version => version + 1);\n  };\n\n  const canUndo = historyVersion > -1 && historyPastRef.current.length > 0;\n  const canRedo = historyVersion > -1 && historyFutureRef.current.length > 0;\n\n  React.useEffect(() => {\n    const handleEditorShortcut = (event: KeyboardEvent) => {\n      if (contentType !== 'html' || viewMode !== 'visual') return;\n      const target = event.target as HTMLElement | null;\n      const isTyping = Boolean(\n        target?.isContentEditable ||\n        target?.tagName === 'INPUT' ||\n        target?.tagName === 'TEXTAREA' ||\n        target?.tagName === 'SELECT'\n      );\n      if (isTyping || !(event.ctrlKey || event.metaKey)) return;\n\n      const key = event.key.toLowerCase();\n      if (key === 'z' && !event.shiftKey) {\n        if (!canUndo) return;\n        event.preventDefault();\n        undoBlocks();\n      } else if (key === 'y' || (key === 'z' && event.shiftKey)) {\n        if (!canRedo) return;\n        event.preventDefault();\n        redoBlocks();\n      }\n    };\n\n    window.addEventListener('keydown', handleEditorShortcut);\n    return () => window.removeEventListener('keydown', handleEditorShortcut);\n  }, [contentType, viewMode, canUndo, canRedo, blocks]);\n\n  const rememberRichTextSelection`,
  'undo redo behavior'
);

replaceExact(
  `<button className="btn-ghost" onClick={onClose}><ArrowLeft size={16} /> Voltar</button>`,
  `<button className="btn-ghost" onClick={requestClose}><ArrowLeft size={16} /> Voltar</button>`,
  'back button guard'
);

replaceExact(
  `          <div className="vpb-header-actions">\n            <button className="btn-primary" onClick={handleSave}>`,
  `          <div className="vpb-header-actions">\n            {contentType === 'html' && viewMode === 'visual' && (\n              <>\n                <button\n                  className="btn-ghost"\n                  onClick={undoBlocks}\n                  disabled={!canUndo}\n                  title="Desfazer (Ctrl+Z)"\n                  aria-label="Desfazer última alteração"\n                  style={{ opacity: canUndo ? 1 : 0.45 }}\n                >\n                  <Undo2 size={16} /> Desfazer\n                </button>\n                <button\n                  className="btn-ghost"\n                  onClick={redoBlocks}\n                  disabled={!canRedo}\n                  title="Refazer (Ctrl+Y ou Ctrl+Shift+Z)"\n                  aria-label="Refazer última alteração"\n                  style={{ opacity: canRedo ? 1 : 0.45 }}\n                >\n                  <Redo2 size={16} /> Refazer\n                </button>\n              </>\n            )}\n            <button className="btn-primary" onClick={handleSave}>`,
  'undo redo header buttons'
);

replaceExact(
  `<button className="btn-ghost" onClick={onClose}>Cancelar</button>`,
  `<button className="btn-ghost" onClick={requestClose}>Cancelar</button>`,
  'cancel button guard'
);

if (!source.includes('Existem alterações não salvas nesta aula.')) throw new Error('Unsaved-changes guard was not applied');
if (!source.includes('title="Desfazer (Ctrl+Z)"')) throw new Error('Undo control was not applied');
if (!source.includes('title="Refazer (Ctrl+Y ou Ctrl+Shift+Z)"')) throw new Error('Redo control was not applied');
if ((source.match(/onClick=\{requestClose\}/g) || []).length < 2) throw new Error('Both exit actions must use requestClose');

fs.writeFileSync(file, source);
console.log('Editor safety + undo/redo patch applied successfully.');

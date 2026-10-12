import fs from 'node:fs';

const file = 'src/components/ModulesAndContent.tsx';
let source = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

function replaceExact(before, after, label) {
  if (!source.includes(before)) throw new Error(`Patch marker not found: ${label}`);
  source = source.replace(before, after);
}

replaceExact(
`  const historyActionRef = useRef<'normal' | 'undo' | 'redo' | 'sync'>('sync');\n  const [historyVersion, setHistoryVersion] = useState(0);`,
`  const historyActionRef = useRef<'normal' | 'undo' | 'redo' | 'sync'>('sync');\n  const pendingHistoryKeyRef = useRef<string | null>(null);\n  const lastHistoryKeyRef = useRef<string | null>(null);\n  const lastHistoryAtRef = useRef(0);\n  const [historyVersion, setHistoryVersion] = useState(0);`,
'history coalescing refs'
);

replaceExact(
`    historyActionRef.current = 'sync';\n    baselineSnapshotRef.current = editorDraftSnapshot({`,
`    historyActionRef.current = 'sync';\n    pendingHistoryKeyRef.current = null;\n    lastHistoryKeyRef.current = null;\n    lastHistoryAtRef.current = 0;\n    baselineSnapshotRef.current = editorDraftSnapshot({`,
'reset history coalescing refs'
);

replaceExact(
`    historyPastRef.current = [...historyPastRef.current.slice(-49), cloneBuilderBlocks(previous)];\n    historyFutureRef.current = [];\n    previousBlocksRef.current = next;\n    setHistoryVersion(version => version + 1);`,
`    const historyKey = pendingHistoryKeyRef.current;\n    pendingHistoryKeyRef.current = null;\n    const now = Date.now();\n    const shouldCoalesce = Boolean(\n      historyKey &&\n      lastHistoryKeyRef.current === historyKey &&\n      now - lastHistoryAtRef.current < 900\n    );\n\n    if (!shouldCoalesce) {\n      historyPastRef.current = [...historyPastRef.current.slice(-49), cloneBuilderBlocks(previous)];\n    }\n    historyFutureRef.current = [];\n    previousBlocksRef.current = next;\n    lastHistoryKeyRef.current = historyKey;\n    lastHistoryAtRef.current = now;\n    setHistoryVersion(version => version + 1);`,
'coalesce repeated property changes'
);

replaceExact(
`  const updateProp = <K extends keyof BuilderBlock['props']>(key: K, value: BuilderBlock['props'][K]) => { setBlocks(current => current.map(b => b.id === selectedBlockId ? { ...b, props: { ...b.props, [key]: value } } : b)); };`,
`  const updateProp = <K extends keyof BuilderBlock['props']>(key: K, value: BuilderBlock['props'][K]) => {\n    pendingHistoryKeyRef.current = selectedBlockId ? \`prop:\${selectedBlockId}:\${String(key)}\` : null;\n    setBlocks(current => current.map(b => b.id === selectedBlockId ? { ...b, props: { ...b.props, [key]: value } } : b));\n  };`,
'mark property history key'
);

replaceExact(
`  const moveBlock = (id: string, dir: number) => setBlocks(current => reorderBlocks(current, id, dir));`,
`  const moveBlock = (id: string, dir: number) => { pendingHistoryKeyRef.current = null; setBlocks(current => reorderBlocks(current, id, dir)); };`,
'move remains discrete'
);

replaceExact(
`  const duplicateBlock = (id: string) => {\n    const newId = generateId();`,
`  const duplicateBlock = (id: string) => {\n    pendingHistoryKeyRef.current = null;\n    const newId = generateId();`,
'duplicate remains discrete'
);

replaceExact(
`  const deleteBlock = (id: string) => { setBlocks(current => current.filter(b => b.id !== id)); if (selectedBlockId === id) setSelectedBlockId(null); };`,
`  const deleteBlock = (id: string) => { pendingHistoryKeyRef.current = null; setBlocks(current => current.filter(b => b.id !== id)); if (selectedBlockId === id) setSelectedBlockId(null); };`,
'delete remains discrete'
);

replaceExact(
`  const undoBlocks = () => {\n    const previous = historyPastRef.current.at(-1);`,
`  const undoBlocks = () => {\n    pendingHistoryKeyRef.current = null;\n    lastHistoryKeyRef.current = null;\n    lastHistoryAtRef.current = 0;\n    const previous = historyPastRef.current.at(-1);`,
'undo resets coalescing'
);

replaceExact(
`  const redoBlocks = () => {\n    const next = historyFutureRef.current.at(-1);`,
`  const redoBlocks = () => {\n    pendingHistoryKeyRef.current = null;\n    lastHistoryKeyRef.current = null;\n    lastHistoryAtRef.current = 0;\n    const next = historyFutureRef.current.at(-1);`,
'redo resets coalescing'
);

replaceExact(
`  const addBlock = (type: string, subtype?: string) => {\n    const newBlock = { id: generateId(), type, subtype: subtype || null, props: getDefaultProps(type, subtype,storageConfig.language) };`,
`  const addBlock = (type: string, subtype?: string) => {\n    pendingHistoryKeyRef.current = null;\n    const newBlock = { id: generateId(), type, subtype: subtype || null, props: getDefaultProps(type, subtype,storageConfig.language) };`,
'add remains discrete'
);

if (!source.includes('now - lastHistoryAtRef.current < 900')) throw new Error('History coalescing was not applied');
fs.writeFileSync(file, source);
console.log('Editor property history coalescing patch applied.');

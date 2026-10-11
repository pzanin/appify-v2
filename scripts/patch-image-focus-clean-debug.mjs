import fs from 'node:fs';

const runtimePath = 'src/components/PWARuntime.tsx';
let runtime = fs.readFileSync(runtimePath, 'utf8');
runtime = runtime.replace("\n  const [completionDebug, setCompletionDebug] = useState('aguardando clique');", '');
runtime = runtime.replace("    if (!canCompleteLesson || selectedMockupModuleId === null || selectedMockupSubmoduleId === null) { setCompletionDebug('complete bloqueado antes da ação'); return; }\n    const before = learning.debugSnapshot(selectedMockupModuleId, selectedMockupSubmoduleId);\n    const changed = learning.complete(selectedMockupModuleId, selectedMockupSubmoduleId);\n    const after = learning.debugSnapshot(selectedMockupModuleId, selectedMockupSubmoduleId);\n    setCompletionDebug(`complete | changed:${changed ? 'sim' : 'não'} | mem:${before.memoryCompleted ? 1 : 0}→${after.memoryCompleted ? 1 : 0} | storage:${after.stored.includes(after.id) ? 'tem' : 'não tem'}`);\n    if (!changed) return;", "    if (!canCompleteLesson || selectedMockupModuleId === null || selectedMockupSubmoduleId === null) return;\n    if (!learning.complete(selectedMockupModuleId, selectedMockupSubmoduleId)) return;");
runtime = runtime.replace("    if (selectedMockupModuleId === null || selectedMockupSubmoduleId === null) { setCompletionDebug('uncomplete sem aula selecionada'); return; }\n    const before = learning.debugSnapshot(selectedMockupModuleId, selectedMockupSubmoduleId);\n    const changed = learning.uncomplete(selectedMockupModuleId, selectedMockupSubmoduleId);\n    const after = learning.debugSnapshot(selectedMockupModuleId, selectedMockupSubmoduleId);\n    setCompletionDebug(`uncomplete | changed:${changed ? 'sim' : 'não'} | mem:${before.memoryCompleted ? 1 : 0}→${after.memoryCompleted ? 1 : 0} | storage:${after.stored.includes(after.id) ? 'tem' : 'não tem'}`);", "    if (selectedMockupModuleId === null || selectedMockupSubmoduleId === null) return;\n    learning.uncomplete(selectedMockupModuleId, selectedMockupSubmoduleId);");
runtime = runtime.replace("          {selectedMockupSubmodule && (\n            <div style={{ position:'absolute', left:10, bottom:10, zIndex:2200, maxWidth:300, padding:'7px 9px', borderRadius:8, background:'rgba(0,0,0,.86)', color:'#86efac', fontSize:9, lineHeight:1.35, fontFamily:'monospace', pointerEvents:'none' }}>\n              DIAG: {completionDebug}\n            </div>\n          )}\n", '');
fs.writeFileSync(runtimePath, runtime);

const progressPath = 'src/hooks/useLessonProgress.ts';
let progress = fs.readFileSync(progressPath, 'utf8');
progress = progress.replace(/\n\s*debugSnapshot:\(moduleId:number,lessonId:number\)=>\{[\s\S]*?\n\s*\},(?=\n\s*toggle:)/, '');
fs.writeFileSync(progressPath, progress);

const typesPath = 'src/types.ts';
let types = fs.readFileSync(typesPath, 'utf8');
if (!types.includes("imgObjectPosition?:")) {
  types = types.replace("    imgObjectFit?: 'cover' | 'contain' | 'fill';", "    imgObjectFit?: 'cover' | 'contain' | 'fill';\n    imgObjectPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';");
}
fs.writeFileSync(typesPath, types);

const builderPath = 'src/utils/builderHtml.ts';
let builder = fs.readFileSync(builderPath, 'utf8');
builder = builder.replace("case 'image': return { ...base, src: '', alt: 'Imagem', width: '100', align: 'center', imgHeight: 'auto', imgBorderRadius: '0', imgObjectFit: 'cover' as const };", "case 'image': return { ...base, src: '', alt: 'Imagem', width: '100', align: 'center', imgHeight: 'auto', imgBorderRadius: '0', imgObjectFit: 'cover' as const, imgObjectPosition: 'center' as const };");
if (!builder.includes("p.imgObjectPosition = 'center'")) {
  builder = builder.replace("  if (!['auto','16:9','9:16'].includes(p.videoAspectRatio || 'auto')) p.videoAspectRatio = 'auto';", "  if (!['auto','16:9','9:16'].includes(p.videoAspectRatio || 'auto')) p.videoAspectRatio = 'auto';\n  if (!['center','top','bottom','left','right'].includes(p.imgObjectPosition || 'center')) p.imgObjectPosition = 'center';");
}
builder = builder.replace("    const imgF = `object-fit:${p.imgObjectFit || 'cover'};`;", "    const imgF = `object-fit:${p.imgObjectFit || 'cover'};object-position:${p.imgObjectPosition || 'center'};`;");
fs.writeFileSync(builderPath, builder);

const editorPath = 'src/components/ModulesAndContent.tsx';
let editor = fs.readFileSync(editorPath, 'utf8');
const fillControl = `                      <label className=\"vpb-label\">Preenchimento</label>\n                      <select className=\"vpb-input\" value={selectedBlock.props.imgObjectFit || 'cover'} onChange={e => updateProp('imgObjectFit', e.target.value as any)}>\n                        <option value=\"cover\">Cobrir (Cover)</option>\n                        <option value=\"contain\">Conter (Contain)</option>\n                        <option value=\"fill\">Esticar (Fill)</option>\n                      </select>`;
const focusControl = `${fillControl}\n                      <label className=\"vpb-label\">Foco da imagem</label>\n                      <select className=\"vpb-input\" value={selectedBlock.props.imgObjectPosition || 'center'} onChange={e => updateProp('imgObjectPosition', e.target.value as BuilderBlock['props']['imgObjectPosition'])}>\n                        <option value=\"center\">Centro</option>\n                        <option value=\"top\">Topo</option>\n                        <option value=\"bottom\">Base</option>\n                        <option value=\"left\">Esquerda</option>\n                        <option value=\"right\">Direita</option>\n                      </select>`;
if (!editor.includes('Foco da imagem')) {
  if (!editor.includes(fillControl)) throw new Error('image fill control not found');
  editor = editor.replace(fillControl, focusControl);
}
editor = editor.replace("objectFit: (selectedBlock.props.imgObjectFit || 'cover') as any }}", "objectFit: (selectedBlock.props.imgObjectFit || 'cover') as any, objectPosition: selectedBlock.props.imgObjectPosition || 'center' }}");
fs.writeFileSync(editorPath, editor);

console.log('Removed temporary completion diagnostic and added image focal-position controls.');

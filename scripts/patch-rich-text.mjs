import fs from 'node:fs';

const typesPath = 'src/types.ts';
const htmlPath = 'src/utils/builderHtml.ts';
const builderPath = 'src/components/ModulesAndContent.tsx';

function replaceOnce(source, before, after, label) {
  if (!source.includes(before)) throw new Error(`Missing pattern: ${label}`);
  return source.replace(before, after);
}

let types = fs.readFileSync(typesPath, 'utf8');
types = replaceOnce(types,
"    content?: string;\n",
"    content?: string;\n    richContent?: string;\n",
'BuilderBlock.richContent');
fs.writeFileSync(typesPath, types);

let html = fs.readFileSync(htmlPath, 'utf8');
html = replaceOnce(html,
"import { builderAudioSource } from './builderAudio';\n",
"import { builderAudioSource } from './builderAudio';\nimport { plainTextToRichHtml, sanitizeRichTextHtml } from './richText';\n",
'rich text import');
html = replaceOnce(html,
"      case 'text': return `<p style=\"white-space:pre-wrap;margin:0;\">${escapeHtml(p.content)}</p>`;\n",
"      case 'text': {\n        const rich = p.richContent?.trim() ? sanitizeRichTextHtml(p.richContent) : plainTextToRichHtml(p.content);\n        return `<p style=\"white-space:pre-wrap;margin:0;\">${rich}</p>`;\n      }\n",
'text renderer');
fs.writeFileSync(htmlPath, html);

let builder = fs.readFileSync(builderPath, 'utf8');
builder = replaceOnce(builder,
"import { builderAudioSource, readAudioFile } from '../utils/builderAudio';\n",
"import { builderAudioSource, readAudioFile } from '../utils/builderAudio';\nimport { plainTextToRichHtml, sanitizeRichTextHtml } from '../utils/richText';\n",
'builder rich text import');
builder = replaceOnce(builder,
"  const htmlFileInputRef = useRef<HTMLInputElement>(null);\n",
"  const htmlFileInputRef = useRef<HTMLInputElement>(null);\n  const richTextEditorRef = useRef<HTMLDivElement>(null);\n  const richTextSelectionRef = useRef<Range | null>(null);\n",
'rich text refs');
builder = replaceOnce(builder,
"  const deleteBlock = (id: string) => { setBlocks(current => current.filter(b => b.id !== id)); if (selectedBlockId === id) setSelectedBlockId(null); };\n\n  const handleImageUpload",
"  const deleteBlock = (id: string) => { setBlocks(current => current.filter(b => b.id !== id)); if (selectedBlockId === id) setSelectedBlockId(null); };\n\n  const rememberRichTextSelection = () => {\n    const editor = richTextEditorRef.current;\n    const selection = window.getSelection();\n    if (!editor || !selection || selection.rangeCount === 0) return;\n    const range = selection.getRangeAt(0);\n    if (editor.contains(range.commonAncestorContainer)) richTextSelectionRef.current = range.cloneRange();\n  };\n\n  const syncRichTextEditor = () => {\n    const editor = richTextEditorRef.current;\n    if (!editor) return;\n    updateProp('content', editor.innerText.replace(/\\n{3,}/g, '\\n\\n'));\n    updateProp('richContent', sanitizeRichTextHtml(editor.innerHTML));\n  };\n\n  const applyRichTextCommand = (command: 'bold' | 'italic' | 'underline' | 'foreColor', value?: string) => {\n    const editor = richTextEditorRef.current;\n    const range = richTextSelectionRef.current;\n    if (!editor || !range) return;\n    editor.focus();\n    const selection = window.getSelection();\n    selection?.removeAllRanges();\n    selection?.addRange(range);\n    document.execCommand('styleWithCSS', false, 'true');\n    document.execCommand(command, false, value);\n    rememberRichTextSelection();\n    syncRichTextEditor();\n  };\n\n  const handleImageUpload",
'rich text helpers');

const oldTextUi = `                  {selectedBlock.type === 'text' && (\n                    <>\n                      <label className=\"vpb-label\">Texto</label>\n                      <textarea className=\"vpb-textarea\" value={selectedBlock.props.content || ''} onChange={e => updateProp('content', e.target.value)} />\n                    </>\n                  )}`;
const newTextUi = `                  {selectedBlock.type === 'text' && (\n                    <>\n                      <label className=\"vpb-label\">Texto</label>\n                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>\n                        <button type=\"button\" className=\"btn-ghost\" style={{ fontWeight: 800, minWidth: '34px' }} onMouseDown={e => { e.preventDefault(); applyRichTextCommand('bold'); }} title=\"Negrito\">B</button>\n                        <button type=\"button\" className=\"btn-ghost\" style={{ fontStyle: 'italic', minWidth: '34px' }} onMouseDown={e => { e.preventDefault(); applyRichTextCommand('italic'); }} title=\"Itálico\">I</button>\n                        <button type=\"button\" className=\"btn-ghost\" style={{ textDecoration: 'underline', minWidth: '34px' }} onMouseDown={e => { e.preventDefault(); applyRichTextCommand('underline'); }} title=\"Sublinhado\">U</button>\n                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--muted)' }}>Cor\n                          <input type=\"color\" aria-label=\"Cor do texto selecionado\" defaultValue=\"#333333\" onMouseDown={rememberRichTextSelection} onChange={e => applyRichTextCommand('foreColor', e.target.value)} />\n                        </label>\n                      </div>\n                      <div\n                        key={selectedBlock.id}\n                        ref={richTextEditorRef}\n                        className=\"vpb-textarea\"\n                        contentEditable\n                        suppressContentEditableWarning\n                        role=\"textbox\"\n                        aria-multiline=\"true\"\n                        onMouseUp={rememberRichTextSelection}\n                        onKeyUp={rememberRichTextSelection}\n                        onBlur={syncRichTextEditor}\n                        style={{ minHeight: '120px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}\n                        dangerouslySetInnerHTML={{ __html: selectedBlock.props.richContent?.trim() ? sanitizeRichTextHtml(selectedBlock.props.richContent) : plainTextToRichHtml(selectedBlock.props.content || '') }}\n                      />\n                      <p className=\"vpb-html-help\">Selecione uma palavra ou trecho no campo acima e aplique negrito, itálico, sublinhado ou cor. A formatação é sanitizada antes de salvar.</p>\n                    </>\n                  )}`;
builder = replaceOnce(builder, oldTextUi, newTextUi, 'text editor UI');
fs.writeFileSync(builderPath, builder);

console.log('Rich text patch applied.');

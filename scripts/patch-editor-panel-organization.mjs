import fs from 'node:fs';

const file = 'src/components/ModulesAndContent.tsx';
const raw = fs.readFileSync(file, 'utf8');
const usesCrLf = raw.includes('\r\n');
let source = raw.replace(/\r\n/g, '\n');

function replaceExact(before, after, label) {
  if (!source.includes(before)) throw new Error(`Patch marker not found: ${label}`);
  source = source.replace(before, after);
}

replaceExact(
`}) => JSON.stringify(value);\n\nexport function ModulesAndContent`,
`}) => JSON.stringify(value);\n\ntype PropertySectionKey = 'content' | 'style' | 'advanced' | 'lessonAdvanced';\n\nconst propertySectionStyle: React.CSSProperties = {\n  border: '1px solid var(--border)',\n  borderRadius: '12px',\n  background: 'var(--surface)',\n  overflow: 'hidden'\n};\n\nconst propertySummaryStyle: React.CSSProperties = {\n  width: '100%',\n  display: 'flex',\n  alignItems: 'center',\n  justifyContent: 'space-between',\n  gap: '8px',\n  cursor: 'pointer',\n  padding: '12px 14px',\n  fontSize: '11px',\n  fontWeight: 800,\n  textTransform: 'uppercase',\n  letterSpacing: '0.06em',\n  textAlign: 'left',\n  color: 'var(--text)',\n  background: 'var(--surface2)',\n  border: 0,\n  borderBottom: '1px solid var(--border)',\n  userSelect: 'none'\n};\n\nconst propertySectionBodyStyle: React.CSSProperties = { padding: '12px' };\n\nexport function ModulesAndContent`,
'property section styles'
);

replaceExact(
`  const [viewMode, setViewMode] = useState<'visual' | 'code'>(submodule.htmlMode || 'visual');\n  const [submoduleName, setSubmoduleName] = useState(submodule.name || '');`,
`  const [viewMode, setViewMode] = useState<'visual' | 'code'>(submodule.htmlMode || 'visual');\n  const [submoduleName, setSubmoduleName] = useState(submodule.name || '');\n  const [propertySections, setPropertySections] = useState<Record<PropertySectionKey, boolean>>({\n    content: true,\n    style: true,\n    advanced: false,\n    lessonAdvanced: false\n  });\n  const togglePropertySection = (key: PropertySectionKey) => setPropertySections(current => ({ ...current, [key]: !current[key] }));`,
'property section state'
);

replaceExact(
`              <div className="animate-in fade-in slide-in-from-right-4 duration-300">`,
`              <div className="animate-in fade-in slide-in-from-right-4 duration-300" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>`,
'property stack'
);

replaceExact(
`                {/* ── CONTEÚDO DO BLOCO ── */}\n                <div className="vpb-prop-group">\n                  <span className="vpb-lib-label">Conteúdo do Bloco</span>`,
`                {/* ── CONTEÚDO DO BLOCO ── */}\n                <section style={{ ...propertySectionStyle, order: 1 }}>\n                  <button type="button" style={propertySummaryStyle} aria-expanded={propertySections.content} onClick={() => togglePropertySection('content')}>\n                    <span>Conteúdo</span><span aria-hidden="true">{propertySections.content ? '−' : '+'}</span>\n                  </button>\n                  <div style={{ ...propertySectionBodyStyle, display: propertySections.content ? 'block' : 'none' }}>\n                    <div className="vpb-prop-group" style={{ marginBottom: 0 }}>`,
'content section open'
);

replaceExact(
`                  )}\n                </div>\n\n                {(selectedBlock.type === 'link' || selectedBlock.subtype === 'cta') && (`,
`                  )}\n                    </div>\n                  </div>\n                </section>\n\n                <section style={{ ...propertySectionStyle, order: 3 }}>\n                  <button type="button" style={propertySummaryStyle} aria-expanded={propertySections.advanced} onClick={() => togglePropertySection('advanced')}>\n                    <span>Avançado</span><span aria-hidden="true">{propertySections.advanced ? '−' : '+'}</span>\n                  </button>\n                  <div style={{ ...propertySectionBodyStyle, display: propertySections.advanced ? 'block' : 'none' }}>\n                {(selectedBlock.type === 'link' || selectedBlock.subtype === 'cta') && (`,
'content close advanced open'
);

replaceExact(
`                {selectedBlock.type === 'container' && <div className="vpb-prop-group">\n                  <span className="vpb-lib-label">Layout da seção</span>`,
`                {selectedBlock.type === 'container' && <div className="vpb-prop-group" style={{ marginBottom: 0 }}>\n                  <span className="vpb-lib-label">Layout da seção</span>`,
'advanced layout group'
);

replaceExact(
`                </div>}\n\n                {/* ── TÍTULO AVANÇADO ── */}`,
`                </div>}\n                  </div>\n                </section>\n\n                <section style={{ ...propertySectionStyle, order: 2 }}>\n                  <button type="button" style={propertySummaryStyle} aria-expanded={propertySections.style} onClick={() => togglePropertySection('style')}>\n                    <span>Estilo</span><span aria-hidden="true">{propertySections.style ? '−' : '+'}</span>\n                  </button>\n                  <div style={{ ...propertySectionBodyStyle, display: propertySections.style ? 'block' : 'none' }}>\n                {/* ── TÍTULO AVANÇADO ── */}`,
'advanced close style open'
);

replaceExact(
`                <div className="vpb-prop-group">\n                  <span className="vpb-lib-label">Estilos do Bloco</span>`,
`                <div className="vpb-prop-group" style={{ marginBottom: 0 }}>\n                  <span className="vpb-lib-label">Estilos do Bloco</span>`,
'global style group'
);

replaceExact(
`                </div>\n\n\n              </div>\n            )}\n\n            <div className="mt-8 pt-6 border-t border-[var(--border)]">\n              <div className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mb-4">Gamificação & Anti-Cheat</div>`,
`                </div>\n                  </div>\n                </section>\n\n\n              </div>\n            )}\n\n            <section style={{ ...propertySectionStyle, marginTop: '16px' }}>\n              <button type="button" style={propertySummaryStyle} aria-expanded={propertySections.lessonAdvanced} onClick={() => togglePropertySection('lessonAdvanced')}>\n                <span>Avançado da Aula</span><span aria-hidden="true">{propertySections.lessonAdvanced ? '−' : '+'}</span>\n              </button>\n              <div style={{ ...propertySectionBodyStyle, display: propertySections.lessonAdvanced ? 'block' : 'none' }}>\n              <div className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mb-4">Gamificação & Anti-Cheat</div>`,
'style close lesson advanced open'
);

replaceExact(
`              </div>\n            </div>\n          </div>\n        </aside>`,
`              </div>\n              </div>\n            </section>\n          </div>\n        </aside>`,
'lesson advanced close'
);

if (!source.includes("togglePropertySection('content')")) throw new Error('Conteúdo section was not created');
if (!source.includes("togglePropertySection('style')")) throw new Error('Estilo section was not created');
if (!source.includes("togglePropertySection('advanced')")) throw new Error('Avançado section was not created');
if (!source.includes("togglePropertySection('lessonAdvanced')")) throw new Error('Lesson advanced section was not created');
if (source.includes('<details style={{ ...propertySectionStyle')) throw new Error('Property panel must not use details elements');

if (usesCrLf) source = source.replace(/\n/g, '\r\n');
fs.writeFileSync(file, source);
console.log('Editor property panel organization patch applied.');

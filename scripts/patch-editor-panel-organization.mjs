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
`}) => JSON.stringify(value);\n\nconst propertySectionStyle: React.CSSProperties = {\n  border: '1px solid var(--border)',\n  borderRadius: '12px',\n  background: 'var(--surface)',\n  overflow: 'hidden'\n};\n\nconst propertySummaryStyle: React.CSSProperties = {\n  cursor: 'pointer',\n  listStyle: 'none',\n  padding: '12px 14px',\n  fontSize: '11px',\n  fontWeight: 800,\n  textTransform: 'uppercase',\n  letterSpacing: '0.06em',\n  color: 'var(--text)',\n  background: 'var(--surface2)',\n  borderBottom: '1px solid var(--border)',\n  userSelect: 'none'\n};\n\nconst propertySectionBodyStyle: React.CSSProperties = { padding: '12px' };\n\nexport function ModulesAndContent`,
'property section styles'
);

replaceExact(
`              <div className="animate-in fade-in slide-in-from-right-4 duration-300">`,
`              <div className="animate-in fade-in slide-in-from-right-4 duration-300" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>`,
'property stack'
);

replaceExact(
`                {/* ── CONTEÚDO DO BLOCO ── */}\n                <div className="vpb-prop-group">\n                  <span className="vpb-lib-label">Conteúdo do Bloco</span>`,
`                {/* ── CONTEÚDO DO BLOCO ── */}\n                <details open style={{ ...propertySectionStyle, order: 1 }}>\n                  <summary style={propertySummaryStyle}>Conteúdo</summary>\n                  <div style={propertySectionBodyStyle}>\n                    <div className="vpb-prop-group" style={{ marginBottom: 0 }}>`,
'content section open'
);

replaceExact(
`                  {selectedBlock.type === 'container' && selectedBlock.subtype === 'cta' && (\n                    <>`,
`                  {selectedBlock.type === 'container' && selectedBlock.subtype === 'cta' && (\n                    <>`,
'cta marker sanity'
);

replaceExact(
`                  )}\n                </div>\n\n                {(selectedBlock.type === 'link' || selectedBlock.subtype === 'cta') && (`,
`                  )}\n                    </div>\n                  </div>\n                </details>\n\n                <details style={{ ...propertySectionStyle, order: 3 }}>\n                  <summary style={propertySummaryStyle}>Avançado</summary>\n                  <div style={propertySectionBodyStyle}>\n                {(selectedBlock.type === 'link' || selectedBlock.subtype === 'cta') && (`,
'content close advanced open'
);

replaceExact(
`                {selectedBlock.type === 'container' && <div className="vpb-prop-group">\n                  <span className="vpb-lib-label">Layout da seção</span>`,
`                {selectedBlock.type === 'container' && <div className="vpb-prop-group" style={{ marginBottom: 0 }}>\n                  <span className="vpb-lib-label">Layout da seção</span>`,
'advanced layout group'
);

replaceExact(
`                </div>}\n\n                {/* ── TÍTULO AVANÇADO ── */}`,
`                </div>}\n                  </div>\n                </details>\n\n                <details open style={{ ...propertySectionStyle, order: 2 }}>\n                  <summary style={propertySummaryStyle}>Estilo</summary>\n                  <div style={propertySectionBodyStyle}>\n                {/* ── TÍTULO AVANÇADO ── */}`,
'advanced close style open'
);

replaceExact(
`                <div className="vpb-prop-group">\n                  <span className="vpb-lib-label">Estilos do Bloco</span>`,
`                <div className="vpb-prop-group" style={{ marginBottom: 0 }}>\n                  <span className="vpb-lib-label">Estilos do Bloco</span>`,
'global style group'
);

replaceExact(
`                </div>\n\n\n              </div>\n            )}\n\n            <div className="mt-8 pt-6 border-t border-[var(--border)]">\n              <div className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mb-4">Gamificação & Anti-Cheat</div>`,
`                </div>\n                  </div>\n                </details>\n\n\n              </div>\n            )}\n\n            <details style={{ ...propertySectionStyle, marginTop: '16px' }}>\n              <summary style={propertySummaryStyle}>Avançado da Aula</summary>\n              <div style={propertySectionBodyStyle}>\n              <div className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mb-4">Gamificação & Anti-Cheat</div>`,
'style close lesson advanced open'
);

replaceExact(
`              </div>\n            </div>\n          </div>\n        </aside>`,
`              </div>\n              </div>\n            </details>\n          </div>\n        </aside>`,
'lesson advanced close'
);

if (!source.includes('<summary style={propertySummaryStyle}>Conteúdo</summary>')) throw new Error('Conteúdo section was not created');
if (!source.includes('<summary style={propertySummaryStyle}>Estilo</summary>')) throw new Error('Estilo section was not created');
if (!source.includes('<summary style={propertySummaryStyle}>Avançado</summary>')) throw new Error('Avançado section was not created');
if (!source.includes('<summary style={propertySummaryStyle}>Avançado da Aula</summary>')) throw new Error('Lesson advanced section was not created');

if (usesCrLf) source = source.replace(/\n/g, '\r\n');
fs.writeFileSync(file, source);
console.log('Editor property panel organization patch applied.');

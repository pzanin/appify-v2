import fs from 'node:fs';

const builderPath = 'src/utils/builderHtml.ts';
let builder = fs.readFileSync(builderPath, 'utf8');
const cssNeedle = "  .appify-builder-content .appify-builder-grid.appify-mobile-reverse > :last-child { order:1; }";
if (!builder.includes('.appify-image-text-grid.appify-image-text-mobile-text-first .appify-image-text-copy')) {
  builder = builder.replace(cssNeedle, `${cssNeedle}\n  .appify-builder-content .appify-image-text-grid.appify-image-text-mobile-image-first .appify-image-text-image { order:1; }\n  .appify-builder-content .appify-image-text-grid.appify-image-text-mobile-image-first .appify-image-text-copy { order:2; }\n  .appify-builder-content .appify-image-text-grid.appify-image-text-mobile-text-first .appify-image-text-copy { order:1; }\n  .appify-builder-content .appify-image-text-grid.appify-image-text-mobile-text-first .appify-image-text-image { order:2; }`);
}
fs.writeFileSync(builderPath, builder);

const editorPath = 'src/components/ModulesAndContent.tsx';
let editor = fs.readFileSync(editorPath, 'utf8');
const fitNeedle = `                      <select className="vpb-input" value={selectedBlock.props.imageObjectFit || 'cover'} onChange={e => updateProp('imageObjectFit', e.target.value as any)}>\n                        <option value="cover">Cobrir (Cover)</option>\n                        <option value="contain">Conter (Contain)</option>\n                        <option value="fill">Esticar (Fill)</option>\n                      </select>`;
if (!editor.includes('<label className="vpb-label">Foco da imagem</label>')) {
  editor = editor.replace(fitNeedle, `${fitNeedle}\n                      <label className="vpb-label">Foco da imagem</label>\n                      <select className="vpb-input" value={selectedBlock.props.imageObjectPosition || 'center'} onChange={e => updateProp('imageObjectPosition', e.target.value as BuilderBlock['props']['imageObjectPosition'])}>\n                        <option value="center">Centro</option>\n                        <option value="top">Topo</option>\n                        <option value="bottom">Base</option>\n                        <option value="left">Esquerda</option>\n                        <option value="right">Direita</option>\n                      </select>`);
}
fs.writeFileSync(editorPath, editor);
console.log('Image + Text final responsive details applied.');

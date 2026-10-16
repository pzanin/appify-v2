const fs=require('fs');

function replaceOnce(path,from,to){
  const text=fs.readFileSync(path,'utf8');
  if(!text.includes(from)) throw new Error(`Anchor not found in ${path}`);
  fs.writeFileSync(path,text.replace(from,to));
}

replaceOnce(
  'src/utils/builderHtml.ts',
  "        const button=value ? `<a href=\"#\" data-appify-action=\"copy\" data-appify-value=\"${escapeHtml(value)}\" data-appify-target=\"${escapeHtml(String(mod.id))}\" style=\"display:inline-block;max-width:100%;padding:12px 24px;border-radius:${p.borderRadius}px;background:${p.buttonColor};color:${p.buttonTextColor};font-size:${p.fontSize}px;font-weight:600;text-decoration:none;text-align:center;overflow-wrap:anywhere;\">${escapeHtml(p.buttonText?.trim() || copy('Copiar conteúdo'))}</a>` : '';\n        return `${heading}${button}`;",
  "        const visible=value ? `<p data-appify-copy-content=\"${escapeHtml(String(mod.id))}\" style=\"white-space:pre-wrap;margin:0 0 12px;overflow-wrap:anywhere;\">${escapeHtml(value)}</p>` : '';\n        const button=value ? `<a href=\"#\" data-appify-action=\"copy\" data-appify-value=\"${escapeHtml(value)}\" data-appify-target=\"${escapeHtml(String(mod.id))}\" style=\"display:inline-block;max-width:100%;padding:12px 24px;border-radius:${p.borderRadius}px;background:${p.buttonColor};color:${p.buttonTextColor};font-size:${p.fontSize}px;font-weight:600;text-decoration:none;text-align:center;overflow-wrap:anywhere;\">${escapeHtml(p.buttonText?.trim() || copy('Copiar conteúdo'))}</a>` : '';\n        return `${heading}${visible}${button}`;"
);

const testPath='src/utils/builderMaterialActions.test.ts';
let test=fs.readFileSync(testPath,'utf8');
const from="  const copyLink=new JSDOM(copy).window.document.querySelector('[data-appify-action=\"copy\"]')!;\n  assert.equal(copyLink.getAttribute('data-appify-target'),'copy-1');\n  assert.equal(copyLink.getAttribute('data-appify-value'),'My answer <safe>');\n  assert.equal(copyLink.textContent,'Copy answer');";
const to="  const copyDoc=new JSDOM(copy).window.document;\n  const copyVisible=copyDoc.querySelector('[data-appify-copy-content=\"copy-1\"]')!;\n  const copyLink=copyDoc.querySelector('[data-appify-action=\"copy\"]')!;\n  assert.equal(copyVisible.textContent,'My answer <safe>');\n  assert.ok(copy.includes('My answer &lt;safe&gt;'));\n  assert.equal(copyLink.getAttribute('data-appify-target'),'copy-1');\n  assert.equal(copyLink.getAttribute('data-appify-value'),'My answer <safe>');\n  assert.equal(copyLink.textContent,'Copy answer');";
if(!test.includes(from)) throw new Error('Test anchor not found');
fs.writeFileSync(testPath,test.replace(from,to));
console.log('Copy action visibility migration applied.');

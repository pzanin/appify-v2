import { compile } from 'tailwindcss';
import JSON5 from 'json5';
import themeCss from './tailwindTheme.json';
import preflightCss from './tailwindPreflight.json';
import { assertPublicExport } from './exportSecurity';
import { ACTIVITY_STORAGE_BRIDGE } from './activityStorage';

import { INTERACTIVE_CSP } from './securityPolicies';
export { INTERACTIVE_CSP } from './securityPolicies';
const compiled = new Map<string, Promise<string>>();

// Repair common Markdown copy artifacts, never evaluating configuration in the editor.
export function normalizeHtmlPaste(source: string) {
  return source.trim().replace(/^```(?:html)?\s*\n?|\n?```$/gi,'')
    .replace(/\\(?=[<>`])/g,'').replace(/ambientGlow\\\.style/g,'ambientGlow.style')
    .replace(/\[([^\]\n]+)\]\((https:\/\/[^)\n]+)\)/g,(_match,_label,url)=>url.replace(/\\&/g,'&'))
    .replace(/\\(?=[*])/g,'');
}

export function interactiveWarnings(source: string): string[] {
  const warnings: string[] = [];
  if (/\b(?:src|href)\s*=\s*["'](?:https?:|\/|\.\/)/i.test(source)) warnings.push('Recursos externos/arquivos relativos ficam bloqueados. O Tailwind reconhecido será convertido em CSS local; use imagens embutidas e fontes locais.');
  if (/\b(?:fetch\s*\(|XMLHttpRequest|WebSocket|sessionStorage|document\.cookie|\bimport\s)/.test(source)) warnings.push('Rede, sessionStorage, cookies e módulos externos não estão disponíveis neste modo.');
  return warnings;
}

function colorTheme(value: unknown, prefix: string[] = []): string {
  if (typeof value === 'string' && /^(#[0-9a-f]{3,8}|[a-z]+|(?:rgb|hsl)a?\([0-9.,%\s/]+\))$/i.test(value)) return `--color-${prefix.join('-')}: ${value};`;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  return Object.entries(value).map(([key,item])=>/^[a-z0-9_-]+$/i.test(key) ? colorTheme(item,key==='DEFAULT'?prefix:[...prefix,key]) : '').join('\n');
}

async function prepare(source: string): Promise<string> {
  if (source.length > 5 * 1024 * 1024) throw new Error('O HTML interativo deve ter no máximo 5 MB.');
  assertPublicExport(source);
  const doc = new DOMParser().parseFromString(normalizeHtmlPaste(source),'text/html');
  let tailwind = false;
  let customTheme = '';
  const candidates = new Set<string>();
  doc.querySelectorAll('[class]').forEach(node=>node.classList.forEach(name=>candidates.add(name)));
  for (const script of doc.querySelectorAll('script')) {
    if (script.src) {
      try { tailwind ||= ['cdn.tailwindcss.com','cdn.jsdelivr.net'].includes(new URL(script.src).hostname) && /tailwind/i.test(script.src); } catch { /* Malformed resource is blocked. */ }
      script.remove();continue;
    }
    const text = script.textContent || '';
    // Include literal classList variants used by the activity's JavaScript.
    for (const match of text.matchAll(/["'`]([^"'`\n]+)["'`]/g)) match[1].split(/\s+/).forEach(token=>candidates.add(token));
    if (/tailwind\.config\s*=/.test(text)) {
      const literal = text.slice(text.indexOf('=',text.indexOf('tailwind.config'))+1).trim().replace(/;\s*$/,'');
      let config: any;
      try { config=JSON5.parse(literal); } catch { throw new Error('A configuração Tailwind deve conter apenas valores, sem funções ou código adicional.'); }
      const extension = config.theme?.extend || {};
      if (config.plugins || Object.keys(extension).some(key=>!['colors','fontFamily'].includes(key)) || Object.keys(config.theme || {}).some(key=>key!=='extend')) throw new Error('Este modo suporta Tailwind padrão e theme.extend de colors/fontFamily. Converta outras personalizações para CSS antes de importar.');
      customTheme += colorTheme(extension.colors);
      for (const [name,fonts] of Object.entries(extension.fontFamily || {})) {
        if (/^[a-z0-9_-]+$/i.test(name) && Array.isArray(fonts) && fonts.every(font=>typeof font==='string' && /^[a-z0-9 -]+$/i.test(font))) customTheme+=`--font-${name}: ${fonts.map(font=>['serif','sans-serif','monospace','system-ui'].includes(font)?font:`"${font}"`).join(',')};`;
      }
      script.remove();
    }
  }
  if (candidates.size > 10000) throw new Error('O HTML contém classes demais. Divida a atividade em páginas menores.');
  doc.querySelectorAll('meta,base,link,iframe,object,embed').forEach(node=>node.remove());
  doc.querySelectorAll('*').forEach(node=>{
    for (const attr of [...node.attributes]) {
      if (['srcdoc','action','formaction','ping','autofocus'].includes(attr.name)) node.removeAttribute(attr.name);
      if (['src','href','poster','xlink:href'].includes(attr.name) && !/^(?:data:(?:image|audio|video)\/|#)/i.test(attr.value)) node.removeAttribute(attr.name);
    }
  });
  if (tailwind) {
    const compiler=await compile(`${themeCss}\n@theme { ${customTheme} }\n@tailwind utilities;`);
    const style=doc.createElement('style');style.id='appify-compiled-tailwind';
    style.textContent=preflightCss+'button{cursor:pointer}'+compiler.build([...candidates]);
    doc.head.prepend(style);
  }
  const csp=doc.createElement('meta');csp.httpEquiv='Content-Security-Policy';csp.content=INTERACTIVE_CSP;doc.head.prepend(csp);
  const viewport=doc.createElement('meta');viewport.name='viewport';viewport.content='width=device-width,initial-scale=1.0,maximum-scale=5.0';doc.head.append(viewport);
  const responsive=doc.createElement('style');responsive.textContent='html{min-height:100%;overflow-x:hidden}html,body{overflow-y:auto!important}body{min-height:100dvh;height:auto!important}';doc.head.append(responsive);
  if (/\blocalStorage\b/.test(source)) {
    // Delay inline activity code until its scoped history has been loaded by the host.
    doc.querySelectorAll('script:not([type]),script[type=""],script[type="text/javascript"],script[type="application/javascript"]').forEach(script=>script.setAttribute('type','application/appify-pending'));
    const bridge=doc.createElement('script');bridge.textContent=ACTIVITY_STORAGE_BRIDGE;doc.head.insertBefore(bridge,doc.head.querySelector('script'));
  }
  const guard=doc.createElement('script');guard.textContent="window.addEventListener('error',function(event){if(parent!==window)parent.postMessage({type:'appify:activity-error',message:String(event.message||'Erro de JavaScript').slice(0,160)},'*')});";
  doc.head.insertBefore(guard,doc.head.querySelector('script'));
  return '<!DOCTYPE html>'+doc.documentElement.outerHTML;
}

export function prepareInteractiveHtml(source: string): Promise<string> {
  let result=compiled.get(source);
  if (!result) {
    if (compiled.size >= 8) compiled.delete(compiled.keys().next().value!);
    result=prepare(source);compiled.set(source,result);
    result.catch(()=>compiled.delete(source));
  }
  return result;
}

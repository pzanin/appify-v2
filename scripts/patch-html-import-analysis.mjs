import fs from 'node:fs';

const replaceOnce = (source, before, after, label) => {
  if (!source.includes(before)) throw new Error(`Missing ${label}`);
  return source.replace(before, after);
};

const interactivePath = 'src/utils/interactiveHtml.ts';
let interactive = fs.readFileSync(interactivePath, 'utf8');

interactive = replaceOnce(
  interactive,
  `export function interactiveWarnings(source: string): string[] {\n  const warnings: string[] = [];\n  if (/\\b(?:src|href)\\s*=\\s*["'](?:https?:|\\/|\\.\\/)/i.test(source)) warnings.push('Recursos externos/arquivos relativos ficam bloqueados. O Tailwind reconhecido será convertido em CSS local; use imagens embutidas e fontes locais.');\n  if (/\\b(?:fetch\\s*\\(|XMLHttpRequest|WebSocket|sessionStorage|document\\.cookie|\\bimport\\s)/.test(source)) warnings.push('Rede, sessionStorage, cookies e módulos externos não estão disponíveis neste modo.');\n  return warnings;\n}`,
  `export type HtmlImportAnalysis = {\n  hasInlineScript: boolean;\n  hasTailwindCdn: boolean;\n  hasExternalStylesheet: boolean;\n  hasGoogleFonts: boolean;\n  hasExternalImages: boolean;\n  hasRelativeAssets: boolean;\n  hasInlineStyle: boolean;\n  hasNetworkApis: boolean;\n  recommendedMode: 'static' | 'interactive';\n  features: string[];\n  warnings: string[];\n};\n\nexport function analyzeHtmlImport(source: string): HtmlImportAnalysis {\n  const html = normalizeHtmlPaste(source || '');\n  const hasInlineScript = /<script\\b(?![^>]*\\bsrc=)[^>]*>[\\s\\S]*?<\\/script>/i.test(html);\n  const hasTailwindCdn = /<script\\b[^>]*\\bsrc=["'][^"']*(?:cdn\\.tailwindcss\\.com|cdn\\.jsdelivr\\.net[^"']*tailwind)[^"']*["']/i.test(html);\n  const hasExternalStylesheet = /<link\\b[^>]*\\brel=["']stylesheet["'][^>]*\\bhref=["']https?:\\/\\/(?!fonts\\.googleapis\\.com)[^"']+["']/i.test(html) || /<link\\b[^>]*\\bhref=["']https?:\\/\\/(?!fonts\\.googleapis\\.com)[^"']+["'][^>]*\\brel=["']stylesheet["']/i.test(html);\n  const hasGoogleFonts = /fonts\\.googleapis\\.com|fonts\\.gstatic\\.com/i.test(html);\n  const hasExternalImages = /<(?:img|source)\\b[^>]*\\b(?:src|srcset)=["']https?:\\/\\//i.test(html) || /url\\(\\s*["']?https?:\\/\\//i.test(html);\n  const hasRelativeAssets = /\\b(?:src|href|poster)\\s*=\\s*["'](?!https?:|data:|#|mailto:|tel:|\\/\\/)[^"']+/i.test(html);\n  const hasInlineStyle = /<style\\b|\\sstyle\\s*=/i.test(html);\n  const hasNetworkApis = /\\b(?:fetch\\s*\\(|XMLHttpRequest|WebSocket|sessionStorage|document\\.cookie|\\bimport\\s)/.test(html);\n  const recommendedMode: 'static' | 'interactive' = hasInlineScript || hasTailwindCdn ? 'interactive' : 'static';\n  const features: string[] = [];\n  const warnings: string[] = [];\n  if (hasTailwindCdn) features.push('Tailwind CDN');\n  if (hasInlineScript) features.push('JavaScript');\n  if (hasInlineStyle) features.push('CSS embutido');\n  if (hasGoogleFonts) features.push('Google Fonts');\n  if (hasExternalImages) features.push('imagens externas');\n  if (hasExternalStylesheet) features.push('CSS externo');\n  if (hasRelativeAssets) features.push('arquivos relativos');\n  if (hasTailwindCdn) warnings.push('Tailwind detectado: no modo Interativo isolado, o Appify converte as classes reconhecidas para CSS local.');\n  if (hasExternalStylesheet) warnings.push('CSS externo de terceiros não é incorporado automaticamente e pode não aparecer no PWA. Prefira CSS dentro do próprio HTML.');\n  if (hasRelativeAssets) warnings.push('Há caminhos relativos para arquivos locais. Eles precisam ser incorporados ao projeto para funcionar fora da pasta original.');\n  if (hasNetworkApis) warnings.push('O HTML usa recursos de rede/armazenamento que ficam bloqueados no modo isolado.');\n  return { hasInlineScript, hasTailwindCdn, hasExternalStylesheet, hasGoogleFonts, hasExternalImages, hasRelativeAssets, hasInlineStyle, hasNetworkApis, recommendedMode, features, warnings };\n}\n\nexport function interactiveWarnings(source: string): string[] {\n  const analysis = analyzeHtmlImport(source);\n  const warnings = [...analysis.warnings];\n  if (/\\b(?:src|href)\\s*=\\s*["'](?:https?:|\\/|\\.\\/)/i.test(source) && !analysis.hasTailwindCdn) warnings.push('Recursos externos ou arquivos relativos podem ser bloqueados no modo isolado. Use recursos embutidos quando possível.');\n  return [...new Set(warnings)];\n}`,
  'interactive warnings'
);

fs.writeFileSync(interactivePath, interactive);

const builderPath = 'src/components/ModulesAndContent.tsx';
let builder = fs.readFileSync(builderPath, 'utf8');

builder = replaceOnce(
  builder,
  `import { interactiveWarnings, normalizeHtmlPaste } from '../utils/interactiveHtml';`,
  `import { analyzeHtmlImport, interactiveWarnings, normalizeHtmlPaste } from '../utils/interactiveHtml';`,
  'interactive html import'
);

builder = replaceOnce(
  builder,
  `    reader.onload = () => {\n      const importedHtml = typeof reader.result === 'string' ? reader.result : '';\n      const hasRelativeAssets = /(?:src|href)=["'](?!https?:|data:|#|mailto:|tel:|\\/)[^"']+/i.test(importedHtml);\n      setContentHtml(normalizeHtmlPaste(importedHtml));\n      setHasCustomHtml(true);\n      setHtmlImportStatus(hasRelativeAssets\n        ? \`${'${file.name}'} importado. Atenção: arquivos locais referenciados por caminho relativo não foram incorporados.\`\n        : \`${'${file.name}'} importado. Confira o preview antes de salvar.\`);\n      setViewMode('code');\n    };`,
  `    reader.onload = () => {\n      const importedHtml = typeof reader.result === 'string' ? reader.result : '';\n      const normalized = normalizeHtmlPaste(importedHtml);\n      const analysis = analyzeHtmlImport(normalized);\n      setContentHtml(normalized);\n      setHasCustomHtml(true);\n      setHtmlInteractive(analysis.recommendedMode === 'interactive');\n      const detected = analysis.features.length ? \` Detectado: ${'${analysis.features.join(\", \")}'} .\` : '';\n      const recommendation = analysis.recommendedMode === 'interactive'\n        ? ' O Appify ativou Interativo isolado para preservar JavaScript/Tailwind com segurança.'\n        : ' O Appify manteve o modo Estático.';\n      setHtmlImportStatus(\`${'${file.name}'} importado.${'${detected}'}${'${recommendation}'} Confira o preview antes de salvar.\`);\n      setViewMode('code');\n    };`,
  'html import handler'
);

builder = replaceOnce(
  builder,
  `                  <p className="vpb-html-help">{htmlInteractive?'Executa JavaScript inline na atividade, sem acesso aos projetos, rede ou cookies. O histórico via localStorage fica separado por atividade e salvo neste aparelho. Tailwind padrão e cores/fontes de theme.extend são convertidos em CSS local. Outras bibliotecas externas não são executadas.':'Scripts e controles interativos são removidos. Para exercícios com JavaScript, selecione Interativo isolado.'}</p>\n                  {htmlInteractive && interactiveWarnings(contentHtml).map(warning=><p key={warning} className="vpb-html-import-status">{warning}</p>)}`,
  `                  <p className="vpb-html-help">{htmlInteractive?'Executa JavaScript inline na atividade, sem acesso aos projetos, rede ou cookies. O histórico via localStorage fica separado por atividade e salvo neste aparelho. Tailwind padrão e cores/fontes de theme.extend são convertidos em CSS local. Outras bibliotecas externas não são executadas.':'Scripts e controles interativos são removidos. Para exercícios com JavaScript, selecione Interativo isolado.'}</p>\n                  {contentHtml.trim() && (() => { const analysis = analyzeHtmlImport(contentHtml); return <div style={{ marginBottom: '10px', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--surface2)' }}>\n                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Diagnóstico da importação</div>\n                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: analysis.features.length ? '6px' : 0 }}>\n                      {(analysis.features.length ? analysis.features : ['HTML/CSS simples']).map(item => <span key={item} style={{ fontSize: '10px', padding: '3px 7px', borderRadius: '999px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>{item}</span>)}\n                    </div>\n                    <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Modo recomendado: <strong style={{ color: 'var(--text)' }}>{analysis.recommendedMode === 'interactive' ? 'Interativo isolado' : 'Estático'}</strong></div>\n                  </div>; })()}\n                  {htmlInteractive && interactiveWarnings(contentHtml).map(warning=><p key={warning} className="vpb-html-import-status">{warning}</p>)}`,
  'html diagnostics ui'
);

fs.writeFileSync(builderPath, builder);
console.log('HTML import analysis patch applied.');

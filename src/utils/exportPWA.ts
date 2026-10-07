import { lessonHtml } from './lessonHtml';
import { productName } from './productCopy';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { useAppStore } from '../store/useAppStore';
import { projectService } from '../services/projectService';
import { assertPublicExport, assertSafeArchive, isAllowedExportPath, EXPORT_SECURITY_MESSAGE } from './exportSecurity';
import { publicFeatureConfig } from './projectFeatures';
import { generateServiceWorker } from './serviceWorker';
import { prepareInteractiveHtml, INTERACTIVE_CSP } from './interactiveHtml';
import { IMPORTED_HTML_CSP } from './htmlSecurity';
import { prepareResponsiveHtml } from './htmlContent';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character] || character);
}

async function createPwaIcon(source: string | null | undefined, size: number, background: string, appName: string) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Não foi possível preparar os ícones do PWA.');
  context.fillStyle = background || '#7c6fff';
  context.fillRect(0, 0, size, size);

  if (source) {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('O ícone selecionado não pôde ser processado.'));
      image.src = source;
    });
    const available = size * 0.72;
    const scale = Math.min(available / image.naturalWidth, available / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
  } else {
    context.fillStyle = '#ffffff';
    context.font = `700 ${Math.round(size * 0.42)}px Arial, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText((appName.trim()[0] || 'A').toUpperCase(), size / 2, size / 2);
  }

  return new Promise<Blob>((resolve, reject) => canvas.toBlob(
    blob => blob ? resolve(blob) : reject(new Error('Falha ao gerar ícone do PWA.')),
    'image/png',
  ));
}

export const handleExportZIP = async (showToast?: (msg: string, type: 'success' | 'error' | 'loading') => void) => {
  if (showToast) showToast('Iniciando empacotamento do PWA...', 'loading');
  
  try {
    if (!useAppStore.getState().pwaConfig.productId) useAppStore.getState().updatePwaConfig({productId:crypto.randomUUID()});
    const state = useAppStore.getState();
    assertPublicExport({ appName: state.appName, pwaConfig: state.pwaConfig, modules: state.modules });
    const pwaLanguage = state.pwaConfig?.language || 'pt-BR';
    const appName = productName(state.appName,pwaLanguage);
    
    // Extrai apenas os dados necessários do construtor
    const { description, noIndex, showAdvanced, exportHistory, publishedUrl, ...cleanPwaConfig } = publicFeatureConfig(state.pwaConfig);
    
    const appData = {
      appName: state.appName,
      modules: state.modules,
      pwaConfig: cleanPwaConfig,
      activeLocale: pwaLanguage,
    };

    const zip = new JSZip();
    const pageMatches: string[] = [];
    const pageHeaders: string[] = [];

    // 1. Arquivo de dados do PWA
    zip.file('app-data.json', JSON.stringify(appData, null, 2));

    // Mantém cópias HTML independentes das aulas dentro do pacote exportado.
    // A pasta também é criada quando o projeto ainda não possui uma aula HTML.
    zip.folder('pages');
    for (const module of state.modules) {
      for (const lesson of module.subs || []) {
        if (lesson.contentType !== 'html') continue;
        const html = lessonHtml(lesson,pwaLanguage);
        if (!html.trim()) continue;
        const pagePath = `pages/lesson-${module.id}-${lesson.id}.html`;
        if (!isAllowedExportPath(pagePath)) throw new Error('Identificador de aula inválido.');
        zip.file(pagePath, lesson.htmlInteractive ? await prepareInteractiveHtml(html) : prepareResponsiveHtml(html,pwaLanguage));
        pageMatches.push(pagePath);
        pageHeaders.push(`/${pagePath}\n  Content-Security-Policy: ${lesson.htmlInteractive ? `sandbox allow-scripts; ${INTERACTIVE_CSP}` : IMPORTED_HTML_CSP}\n`);
      }
    }

    // 2. Manifest do PWA (configuração standalone)
    const manifest = {
      name: appName,
      short_name: appName,
      id: ".",
      lang: pwaLanguage,
      start_url: ".", // Host-agnostic: funciona em subdiretórios (Vercel, Netlify, Github Pages)
      scope: "./",
      display: "standalone",
      description: description || state.pwaConfig?.tagline || appName,
      background_color: state.pwaConfig?.defaultTheme === 'dark' ? '#091218' : '#ffffff',
      theme_color: state.pwaConfig?.themeColor || '#7c6fff',
      icons: [
        {
          src: "./icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: "./icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ]
    };
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    const iconSource = state.pwaConfig?.iconBase64 || state.pwaConfig?.logoBase64;
    zip.file('icon-192x192.png', await createPwaIcon(iconSource, 192, state.pwaConfig?.themeColor, appName));
    zip.file('icon-512x512.png', await createPwaIcon(iconSource, 512, state.pwaConfig?.themeColor, appName));
    zip.file('apple-touch-icon.png', await createPwaIcon(iconSource, 180, state.pwaConfig?.themeColor, appName));

    let assetMatches: string[] = [];

    // 3. Arquivos do Template Base do PWA (Extrator Dinâmico)
    try {
      const htmlRes = await fetch('./pwa-template/index.html');
      if (htmlRes.ok) {
        let htmlText = await htmlRes.text();
        htmlText = htmlText.replace(/<html lang="[^"]*">/, `<html lang="${escapeHtml(pwaLanguage)}">`);
        htmlText = htmlText.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(appName)}</title>`);
        const installMetadata = `
    <link rel="manifest" href="./manifest.json">
    <link rel="apple-touch-icon" href="./apple-touch-icon.png">
    <meta name="theme-color" content="${escapeHtml(state.pwaConfig?.themeColor || '#7c6fff')}">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="${escapeHtml(appName)}">`;
        htmlText = htmlText.replace('</head>', `${installMetadata}\n  </head>`);

        // Injeta o registro do Service Worker se não existir
        if (!htmlText.includes('serviceWorker in navigator') && !htmlText.includes('serviceWorker\' in navigator')) {
          const swRegistrationScript = `
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Registro do aplicativo concluído.'))
            .catch(err => console.warn('Não foi possível preparar o modo offline.'));
        });
      }
    </script>
  `;
          htmlText = htmlText.replace('</head>', `${swRegistrationScript}\n</head>`);
        }
        zip.file('index.html', htmlText);

        // Inclui os assets do HTML e o chunk carregado dinamicamente pelo runtime.
        // Os nomes são estáveis porque estão definidos em vite.config.ts.
        assetMatches = Array.from(new Set([
          ...[...htmlText.matchAll(/(?:src|href)="[^"]*(assets\/[^"]+)"/g)].map(m => m[1]),
          'assets/pwa-engine-chunk.js',
        ]));
        console.log('Assets encontrados para exportação:', assetMatches);

        for (const assetPath of assetMatches) {
          try {
            if (!isAllowedExportPath(assetPath)) throw new Error('Arquivo de template não permitido.');
            const res = await fetch(`./pwa-template/${assetPath}`);
            if (res.ok) {
              zip.file(assetPath, await res.blob());
            } else {
              throw new Error(`Asset obrigatório não encontrado: ${assetPath}`);
            }
          } catch (err) {
            throw new Error(`Erro ao incluir ${assetPath} no ZIP.`, { cause: err });
          }
        }
      } else {
        throw new Error('Template do PWA indisponível.');
      }
    } catch (err) {
      throw new Error('Não foi possível carregar o template completo do PWA.');
    }

    // 4. Geração do Service Worker sw.js robusto com Cache Offline (PWA Compliance)
    const cacheVersion = `${state.pwaConfig?.version || '1.0.0'}-${crypto.randomUUID()}`;
    const assetsToCache = [
      './',
      './index.html',
      './manifest.json',
      './app-data.json',
      './icon-192x192.png',
      './icon-512x512.png',
      './apple-touch-icon.png',
      ...assetMatches.map(path => `./${path}`),
      ...pageMatches.map(path => `./${path}`)
    ];

    const swContent = generateServiceWorker(`appify-pwa-${cacheVersion}`, assetsToCache, state.pwaConfig?.offlineMode !== false);
    zip.file('sw.js', swContent);

    // Regras de roteamento para hosts (Netlify, Vercel, etc)
    zip.file('_redirects', '/* /index.html 200');
    zip.file('_headers', `/sw.js\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n/app-data.json\n  Cache-Control: no-cache\n/manifest.json\n  Cache-Control: no-cache\n${pageHeaders.join('')}`);

    // Check the assembled archive, including template code, before any disk write/download.
    await assertSafeArchive(zip);

    // 5. Empacota tudo e salva no computador
    const content = await zip.generateAsync({ type: 'blob' });
    const filename = `${appName.toLowerCase().replace(/\s+/g, '-')}-pwa.zip`;
    let buildCopyFailed = false;
    if (projectService.isDesktop() && state.currentProjectId) {
      try {
        const bytes = new Uint8Array(await content.arrayBuffer());
        await projectService.saveBuild(state.currentProjectId, filename, bytes);
      } catch (error) {
        buildCopyFailed = true;
        console.error('Não foi possível salvar a cópia em build/:');
      }
    }
    FileSaver.saveAs(content, filename);

    if (showToast) {
      showToast(
        buildCopyFailed ? 'PWA baixado, mas a cópia em build/ falhou.' : 'PWA exportado com sucesso!',
        buildCopyFailed ? 'error' : 'success',
      );
    }
    return true;
  } catch (error) {
    console.error('Erro ao gerar o ZIP do PWA:');
    if (showToast) showToast(error instanceof Error && error.message === EXPORT_SECURITY_MESSAGE ? EXPORT_SECURITY_MESSAGE : 'Erro ao exportar PWA. Verifique se o template está completo e tente novamente.', 'error');
    return false;
  }
};

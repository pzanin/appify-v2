import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useAppStore } from '../store/useAppStore';

export const handleExportZIP = async (showToast?: (msg: string, type: 'success' | 'error' | 'loading') => void) => {
  if (showToast) showToast('Iniciando empacotamento do PWA...', 'loading');
  
  try {
    const state = useAppStore.getState();
    const appName = state.appName || 'Meu App';
    
    // Extrai apenas os dados necessários do construtor
    const { description, noIndex, showAdvanced, ...cleanPwaConfig } = state.pwaConfig || {};
    
    // REMOÇÃO RÍGIDA DE CHAVES PRIVADAS/SENSÍVEIS (Segurança supabse key leakage)
    const sensitiveKeys = ['supabaseServiceKey', 'serviceKey', 'service_key', 'privateKey', 'private_key'];
    sensitiveKeys.forEach(key => {
      if (key in cleanPwaConfig) {
        delete (cleanPwaConfig as any)[key];
      }
    });

    const appData = {
      appName: state.appName,
      modules: state.modules,
      pwaConfig: cleanPwaConfig,
      activeLocale: state.activeLocale,
    };

    const zip = new JSZip();

    // 1. Arquivo de dados do PWA
    zip.file('app-data.json', JSON.stringify(appData, null, 2));

    // 2. Manifest do PWA (configuração standalone)
    const manifest = {
      name: appName,
      short_name: appName,
      start_url: ".", // Host-agnostic: funciona em subdiretórios (Vercel, Netlify, Github Pages)
      display: "standalone",
      background_color: state.pwaConfig?.defaultTheme === 'dark' ? '#091218' : '#ffffff',
      theme_color: state.pwaConfig?.themeColor || '#7c6fff',
      icons: [
        {
          src: state.pwaConfig?.iconBase64 || "icon-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: state.pwaConfig?.iconBase64 || "icon-512x512.png",
          sizes: "512x512",
          type: "image/png"
        }
      ]
    };
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    let assetMatches: string[] = [];

    // 3. Arquivos do Template Base do PWA (Extrator Dinâmico)
    try {
      const htmlRes = await fetch('/pwa-template/index.html');
      if (htmlRes.ok) {
        let htmlText = await htmlRes.text();

        // Injeta o registro do Service Worker se não existir
        if (!htmlText.includes('serviceWorker in navigator') && !htmlText.includes('serviceWorker\' in navigator')) {
          const swRegistrationScript = `
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado com sucesso:', reg.scope))
            .catch(err => console.error('Falha ao registrar o Service Worker:', err));
        });
      }
    </script>
  `;
          htmlText = htmlText.replace('</head>', `${swRegistrationScript}\n</head>`);
        }
        zip.file('index.html', htmlText);

        // Busca todos os arquivos na pasta assets que o HTML está chamando
        assetMatches = [...htmlText.matchAll(/(?:src|href)="[^"]*(assets\/[^"]+)"/g)].map(m => m[1]);
        console.log('Assets encontrados para exportação:', assetMatches);

        for (const assetPath of assetMatches) {
          try {
            const res = await fetch(`/pwa-template/${assetPath}`);
            if (res.ok) {
              zip.file(assetPath, await res.blob());
            } else {
              console.warn(`Asset não encontrado: ${assetPath}`);
            }
          } catch (err) {
            console.warn(`Erro ao buscar asset: ${assetPath}`, err);
          }
        }
      } else {
        console.warn('index.html do molde não encontrado.');
      }
    } catch (err) {
      console.warn('Erro ao processar arquivos do molde:', err);
    }

    // 4. Geração do Service Worker sw.js robusto com Cache Offline (PWA Compliance)
    const cacheVersion = state.pwaConfig?.version || '1.0.0';
    const assetsToCache = [
      './',
      './index.html',
      './manifest.json',
      './app-data.json',
      ...assetMatches.map(path => `./${path}`)
    ];

    const swContent = `
const CACHE_NAME = 'appify-pwa-v${cacheVersion}';
const ASSETS = ${JSON.stringify(assetsToCache, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Apenas cachear requisições GET locais
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        // Retorna o cacheado, mas tenta atualizar em background (stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Ignorar falhas de rede ao revalidar */});
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch((err) => {
        // Fallback offline para navegações se rede falhar
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        throw err;
      });
    })
  );
});
`;
    zip.file('sw.js', swContent);

    // Regras de roteamento para hosts (Netlify, Vercel, etc)
    zip.file('_redirects', '/* /index.html 200');

    // 5. Empacota tudo e salva no computador
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${appName.toLowerCase().replace(/\s+/g, '-')}-pwa.zip`);

    if (showToast) showToast('PWA exportado com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao gerar o ZIP do PWA:', error);
    if (showToast) showToast('Erro ao exportar PWA.', 'error');
  }
};

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useAppStore } from '../store/useAppStore';

export const handleExportZIP = async (showToast?: (msg: string, type: 'success' | 'error' | 'loading') => void) => {
  if (showToast) showToast('Iniciando empacotamento do PWA...', 'loading');
  
  try {
    const state = useAppStore.getState();
    const appName = state.appName || 'Meu App';
    
    // Extrai apenas os dados necessários do construtor
    const appData = {
      appName: state.appName,
      modules: state.modules,
      pwaConfig: state.pwaConfig
    };

    const zip = new JSZip();

    // 1. Arquivo de dados do PWA
    zip.file('app-data.json', JSON.stringify(appData, null, 2));

    // 2. Manifest do PWA (configuração standalone)
    const manifest = {
      name: appName,
      short_name: appName,
      start_url: "/",
      display: "standalone",
      background_color: state.pwaConfig?.defaultTheme === 'dark' ? '#0d1117' : '#ffffff',
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

    // 3. Arquivos do Template Base do PWA (Extrator Dinâmico)
    try {
      const htmlRes = await fetch('/pwa-template/index.html');
      if (htmlRes.ok) {
        const htmlText = await htmlRes.text();
        zip.file('index.html', htmlText);

        // Busca todos os arquivos na pasta assets que o HTML está chamando
        const assetMatches = [...htmlText.matchAll(/(?:src|href)="[^"]*(assets\/[^"]+)"/g)].map(m => m[1]);
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

    // Regras de roteamento para hosts (Netlify, Vercel, etc)
    zip.file('_redirects', '/* /index.html 200');

    // 4. Empacota tudo
    const content = await zip.generateAsync({ type: 'blob' });

    // 4. Salva no computador
    saveAs(content, `${appName.toLowerCase().replace(/\s+/g, '-')}-pwa.zip`);

    if (showToast) showToast('PWA exportado com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao gerar o ZIP do PWA:', error);
    if (showToast) showToast('Erro ao exportar PWA.', 'error');
  }
};

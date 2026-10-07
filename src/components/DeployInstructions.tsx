import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { openExternalLink } from '../utils/externalLinks';
import { normalizePublishedUrl } from '../utils/publication';

export function DeployInstructions() {
  const pwaConfig = useAppStore(state => state.pwaConfig);
  const publishedUrl = normalizePublishedUrl(pwaConfig.publishedUrl ?? pwaConfig.domain ?? '');
  const updateConfig = useAppStore(state => state.updatePwaConfig);
  return <>
    <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Instruções de Deploy</h4>
    <label className="vpb-label" htmlFor="deploy-provider">Onde publicar</label>
    <select id="deploy-provider" className="vpb-input" style={{marginBottom:16}} value={pwaConfig.deploymentProvider || 'netlify'} onChange={e=>updateConfig({deploymentProvider:e.target.value as 'netlify'|'cloudflare'})}>
      <option value="netlify">Netlify — publicar a pasta exportada</option>
      <option value="cloudflare">Cloudflare Pages — conectar GitHub</option>
    </select>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {(pwaConfig.deploymentProvider !== 'cloudflare' ? [
        { step: '1️⃣', text: 'Clique em Exportar PWA e extraia o ZIP no computador. A pasta enviada deve conter index.html na raiz.' },
        { step: '2️⃣', text: 'Entre na sua conta Netlify e arraste a pasta extraída para o Netlify Drop. Não precisa conectar o GitHub.', btn: 'Abrir Netlify Drop', url: 'https://app.netlify.com/drop' },
        { step: '3️⃣', text: 'Abra o endereço HTTPS fornecido pelo Netlify no celular. O domínio personalizado é opcional; configurá-lo no Appify não altera o DNS.', special: true },
        { step: '4️⃣', text: 'Para atualizar o mesmo app, exporte novamente e envie a nova pasta na aba Deploys do projeto existente. Não crie outro projeto.', btn: 'Abrir painel Netlify', url: 'https://app.netlify.com' }
      ] : [
        { step: '1️⃣', text: 'Extraia o ZIP exportado e envie seus arquivos para um repositório GitHub, com index.html na raiz.', btn: 'Abrir GitHub', url: 'https://github.com' },
        { step: '2️⃣', text: 'No Cloudflare Pages, conecte o repositório. Como os arquivos já estão prontos, deixe o comando de build vazio e use a raiz como diretório de publicação.', btn: 'Abrir Cloudflare', url: 'https://dash.cloudflare.com' },
        { step: '3️⃣', text: 'Configure o domínio personalizado no provedor e seu DNS. Informe o endereço publicado abaixo para usar o QR Code.', special: true },
        { step: '4️⃣', text: 'Quando o deploy terminar, abra o endereço HTTPS do projeto e teste no celular.', btn: 'Testar App', url: publishedUrl || '', disabled: !publishedUrl }
      ]).map((step, idx) => (
        <div key={idx} style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '18px' }}>{step.step}</span>
          <div>
            <p style={{ fontSize: '13px', lineHeight: '1.4', marginBottom: '8px' }}>{step.text}</p>
            {step.special ? (
              publishedUrl ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--accent-glow)', color: 'var(--accent)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                  Seu endereço: {publishedUrl}
                </div>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                  Informe o endereço publicado abaixo para gerar o QR Code
                </div>
              )
            ) : (
              step.btn && <button
                className="btn-ghost"
                style={{ padding: '4px 8px', fontSize: '11px' }}
                onClick={() => step.url && openExternalLink(step.url)}
                disabled={step.disabled}
              >
                {step.btn} <ExternalLink size={10} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
    {pwaConfig.deploymentProvider !== 'cloudflare' && <p style={{fontSize:13,color:'var(--muted)',marginTop:20}}>Se aparecer “Powered by Netlify”, desative o badge no painel: Project configuration → General → Powered by Netlify badge. No celular, use o navegador externo e siga a opção de instalação disponível nele.</p>}
  </>;
}

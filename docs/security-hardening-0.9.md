# Appify 0.9 Local — hardening incremental

Data: 04/10/2026. Branch: `feature/appify-0.9-local-foundation`.

## Auditoria e correções

| Área | Problema encontrado | Correção |
| --- | --- | --- |
| IPC | Handlers aceitavam qualquer sender | Todos os invokes validam a janela registrada, identidade do frame principal e URL exata do renderer. Fechamento também exige pedido de close em andamento. |
| Payloads | Validação parcial e IDs de aulas usados em paths | Validação de workspace, IDs inteiros positivos e limite de 50 MB em workspace/backup. |
| Electron | Sem CSP | CSP em meta no build e header no desenvolvimento. Produção sem scripts inline arbitrários/unsafe-eval; isolamento, sandbox e webSecurity explícitos. |
| Preload | Saída `.mjs` com sandbox ativado | Saída CommonJS `.cjs`, API limitada e exposta somente no frame principal. |
| Links | Prefixos de URL e window.open dispersos | Normalização HTTPS/mailto, rejeição de credenciais e controles; IPC validado; navegador com noopener/noreferrer. Novas janelas, navegação principal e webview bloqueados. |
| HTML | Scripts + same-origin + popups no mesmo iframe | DOMPurify, origem opaca, sandbox sem same-origin/popups, CSP própria e ponte limitada aos links clicados. Frames remotos também ficam isolados. |
| Export | Só cinco nomes de secrets no primeiro nível | Bloqueio em dados aninhados e no ZIP final: chaves privadas comuns, JWTs privados, service_role, campos de credenciais e paths fora da lista permitida. Falha no template interrompe a exportação. |
| Erros | Exceções/stack/corpos de backend nos logs e mensagem bruta na tela | IPC retorna erro fixo; logs não serializam exceções, dados de projeto ou respostas privadas; ErrorBoundary usa mensagem fixa. |
| .env/Git | Artefatos de build rastreados, exemplo de env antigo | .env e material privado ignorados; artefatos deixam de ser rastreados; variáveis .env não são expostas ao renderer. Hook opcional e CI verificam secrets. |

Não foi adicionada autenticação nem backend. A integração opcional preexistente com Supabase não foi ampliada.

## Validação automatizada

```sh
npm ci
npm run lint
npm test
npm run build
npm run check:secrets
npm run check:secrets -- --build
```

`npm run build` gera primeiro o template PWA e depois o renderer/main/preload desktop. `npm run dev` também prepara o template. O servidor de desenvolvimento escuta apenas em loopback. Node >=22.13; CI usa Node 24.

Para ativar o hook na sua cópia local:

```sh
npm run security:hooks
```

Os testes exercitam persistência/assets/backups, rejeição de senders e URLs, IDs contra traversal, erros seguros, sanitização/CSP e bloqueio do ZIP final. O build continua apresentando o aviso anterior de bundles grandes; otimização de tamanho fica fora deste hardening.

## Limites e teste no Windows

- Scripts e formulários arbitrários de HTML importado são removidos na renderização/exportação. Conteúdo que dependia deles precisa de revisão visual. O HTML original do projeto continua disponível para edição.
- Vídeos/sites externos em iframe com origem opaca podem exigir permissões que agora são bloqueadas. Verifique os provedores usados no seu produto; não foi validada a reprodução real neste ambiente.
- Detecção de secrets usa nomes/padrões conhecidos; não prova ausência de credenciais desconhecidas, codificadas ou divididas em fragmentos. Backup de projeto é um arquivo privado do editor, não um pacote para publicação.
- CSP permite HTTPS para mídia/frames e conexões do backend opcional já existente; não há allowlist de domínio específica por produto nesta etapa.
- A interface Electron/instalador Windows não foi validada aqui. O ambiente Linux executa como root e Electron recusou iniciar com sandbox. O sandbox do produto permanece ativado.
- O guard verifica arquivos atuais/no index. Não reescreve nem certifica todo o histórico Git; credenciais anteriormente publicadas precisam de revogação quando identificadas.

Teste manual no Windows: abrir projetos antigos; criar/salvar/duplicar/importar backup; editar HTML visual e importado; abrir um link Hotmart; exportar o ZIP e testar a aula/vídeos no navegador e celular; fechar com alterações pendentes; gerar o instalador com `npm run build:win`.

Referências: [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security), [Electron Sandboxing](https://www.electronjs.org/docs/latest/tutorial/sandbox), [DOMPurify](https://github.com/cure53/DOMPurify).

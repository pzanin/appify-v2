# Appify 0.9 Local — hardening incremental

Atualizado: 05/10/2026. Branch: `feature/appify-0.9-local-foundation`.

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

`npm run build` gera primeiro o template PWA e depois o renderer/main/preload desktop. `npm run dev` também prepara o template. O servidor de desenvolvimento escuta apenas em loopback. Node 22.22.2+ (série 22), 24.15.0+ (série 24) ou 26+; CI usa Node 24.

## Revisão de dependências — 05/10/2026

- Auditoria inicial: 28 entradas vulneráveis (1 crítica, 25 altas, 1 moderada e 1 baixa), incluindo ferramentas de build e o Electron usado no desktop.
- Atualizações compatíveis no lockfile; mínimos de Electron 42.11.10, electron-builder 26.15.3 e Vite 6.4.3. A dependência transitiva tar passou a 7.5.22.
- Removido `shx`, sem uso desde a cópia portátil do template por Node. Não foi usado `npm audit fix --force` nem downgrade automático.
- Instalação limpa com `npm ci`; auditoria completa retornou zero vulnerabilidades conhecidas nessa data. Isso não certifica ausência de falhas desconhecidas nem autenticação de compradores.
- CI executa também `npm audit --audit-level=low`, bloqueando novas alterações com alertas conhecidos em qualquer severidade.
- Testes de tipos, 38 testes automatizados, builds PWA/desktop, scanner de secrets e execução real da atividade no Electron são as verificações desta atualização. O teste resolve o executável pelo pacote Electron, incluindo seu download sob demanda após uma instalação limpa.

Para ativar o hook na sua cópia local:

```sh
npm run security:hooks
```

Os testes exercitam persistência/assets/backups, rejeição de senders e URLs, IDs contra traversal, erros seguros, sanitização/CSP e bloqueio do ZIP final. O build continua apresentando o aviso anterior de bundles grandes; otimização de tamanho fica fora deste hardening.

## Limites e teste no Windows

- HTML estático remove scripts e formulários arbitrários. A opção interativa por aula mantém scripts inline dentro de um iframe isolado, sem acesso ao editor, Node, armazenamento nativo ou rede. O histórico local usa ponte limitada por atividade, sem acesso às outras chaves do host. Consulte `interactive-html-0.9.md`. O HTML original do projeto continua disponível para edição.
- Vídeos/sites externos em iframe com origem opaca podem exigir permissões que agora são bloqueadas. Verifique os provedores usados no seu produto; não foi validada a reprodução real neste ambiente.
- Detecção de secrets usa nomes/padrões conhecidos; não prova ausência de credenciais desconhecidas, codificadas ou divididas em fragmentos. Backup de projeto é um arquivo privado do editor, não um pacote para publicação.
- CSP permite HTTPS para mídia/frames e conexões do backend opcional já existente; não há allowlist de domínio específica por produto nesta etapa.
- O teste de atividade usa Electron/Chromium real no Linux; como o ambiente executa como root, somente esse processo de teste usa `--no-sandbox`. O sandbox do produto permanece ativado. A interface completa e o instalador Windows ainda precisam de validação manual.
- O PWA publicado ainda precisa de inspeção de HTTPS/cabeçalhos de segurança e testes no celular. A entrada por email é demonstrativa, não valida compras nem restringe acesso ao conteúdo.
- O guard verifica arquivos atuais/no index. Não reescreve nem certifica todo o histórico Git; credenciais anteriormente publicadas precisam de revogação quando identificadas.

Teste manual no Windows: abrir projetos antigos; criar/salvar/duplicar/importar backup; editar HTML visual e importado; abrir um link Hotmart; exportar o ZIP e testar a aula/vídeos no navegador e celular; fechar com alterações pendentes; gerar o instalador com `npm run build:win`.

Referências: [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security), [Electron Sandboxing](https://www.electronjs.org/docs/latest/tutorial/sandbox), [DOMPurify](https://github.com/cure53/DOMPurify).

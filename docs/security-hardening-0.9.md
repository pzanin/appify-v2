# Appify 0.9 Local — hardening incremental

Atualizado: 12/10/2026. A base de segurança continua incremental; as alterações atuais incluem backend público opcional e autenticação Supabase do cliente.

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
| Supabase público | Configuração não estava clara por produto | Publicação aceita apenas Project URL + Publishable Key; configuração é opcional e é removida do JSON público quando backend está desligado. |
| Chaves Supabase | Risco de colar credencial privilegiada no frontend | UI, validação e scanner rejeitam Secret Key, service_role e padrões privados. Publishable Key é a única chave nova destinada ao PWA. |
| Login | E-mail simples poderia virar falsa autenticação | Login usa Supabase Auth OTP, sessão persistente e `shouldCreateUser: false`; e-mails desconhecidos não são cadastrados automaticamente pelo PWA. |
| Regras de acesso | Drip/Upsell poderiam ser contornados na prévia/retomada | Módulos, aulas e Continuar de onde parei passam pela mesma avaliação de acesso no PhoneMockup e runtime. |

## Backend e separação de responsabilidades

O Appify desktop continua local. O Supabase é backend opcional do PWA exportado. Essa separação evita que o editor dependa de um serviço online para abrir ou salvar projetos.

A Publishable Key pode existir no frontend porque é uma credencial pública de baixa permissão. Isso não torna os dados públicos automaticamente: tabelas e Storage devem usar RLS correta. Secret Key, `service_role`, senha do banco, segredo de webhook e tokens administrativos pertencem somente a componentes de backend e nunca ao ZIP.

## Autenticação por e-mail

Quando Exigir login por e-mail está ativado, o PWA usa Supabase Auth:

- sessão existente: entra direto;
- sem sessão: solicita OTP para o e-mail informado;
- `shouldCreateUser: false`: não cria conta desconhecida;
- confirmação do OTP: cria/restaura sessão;
- sessão fica persistida pelo cliente Supabase e pode ser renovada automaticamente.

A UI não deve exibir mensagens de erro brutas do Supabase. Falhas são traduzidas em mensagens genéricas para evitar vazamento de detalhes internos.

O template de e-mail precisa incluir `{{ .Token }}` para o fluxo de código numérico. Essa configuração é feita no Supabase Auth.

## Limite crítico: login não é compra e não é DRM

Autenticação Supabase comprova uma identidade, não um pagamento. Ainda não existe nesta etapa entitlement automático por produto nem webhook de Hotmart, Stripe ou outro checkout. Um checkout futuro deverá alimentar um backend confiável, que concederá/revogará entitlements.

O ZIP do PWA é frontend distribuído ao cliente e pode conter conteúdo estático. Uma tela de login não impede que alguém tecnicamente capacitado inspecione arquivos já presentes no pacote. Conteúdo realmente protegido deve ser entregue pelo backend somente após validação da sessão e do entitlement.

## Drip e Upsell

Immediate, Drip e Upsell são funcionais no nível de módulo e aula e são respeitados também pela retomada de conteúdo. O Drip atual usa um timestamp de primeiro acesso mantido no navegador/dispositivo. Esse timestamp é adequado ao MVP, mas não é uma data de compra confiável. Quando o backend de entitlement existir, o marco temporal deverá vir do servidor.

Upsell pode encaminhar para checkout HTTPS, mas o retorno de pagamento ainda não libera automaticamente o conteúdo.

## Validação automatizada

```sh
npm ci
npm run check:secrets
npm audit --audit-level=low
npm run lint
npm test
npm run build:pwa
npm run build
```

O CI bloqueia secrets detectáveis, vulnerabilidades conhecidas no nível configurado, falhas de tipos/testes e builds quebrados.

## Revisão de dependências

- Dependências críticas de build/Electron foram atualizadas de forma compatível.
- O projeto não usa `npm audit fix --force` como correção automática de arquitetura.
- CI usa Node 24 e executa auditoria em cada push/PR.
- O aviso de bundles grandes continua sendo assunto de otimização, não de autenticação.

## Limites e teste manual

- HTML interativo continua isolado em iframe e não recebe acesso administrativo ao Appify.
- O scanner de secrets reconhece padrões conhecidos; não prova ausência de segredos ofuscados ou divididos em fragmentos.
- O PWA publicado ainda deve ser testado com HTTPS, cabeçalhos, CORS, Auth e RLS reais.
- Para autenticação, testar usuário existente, usuário não cadastrado, código correto/incorreto, expiração, reabertura com sessão e troca de dispositivo.
- Para acesso, testar Drip/Upsell em módulo, aula e Continuar de onde parei.
- Para exportação, inspecionar `app-data.json` e confirmar que nenhuma Secret Key/service_role aparece.

Teste manual no Windows: abrir projetos antigos; criar/salvar/duplicar/importar backup; editar HTML visual e importado; abrir checkout externo; configurar Supabase público; exportar ZIP; testar PWA no navegador/celular; fechar com alterações pendentes; gerar o instalador com `npm run build:win` quando necessário.

Detalhes do fluxo atual: `docs/backend-access-auth-0.9.md` e `docs/customer-entry-0.9.md`.

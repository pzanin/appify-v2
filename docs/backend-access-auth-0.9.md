# Backend, regras de acesso e autenticação — Appify 0.9 Local

Atualizado: 12/10/2026. Branch de implementação: `feature/customer-auth-login`.

## Arquitetura adotada

O Appify desktop continua local e não depende do Supabase para abrir, editar ou salvar projetos. O Supabase é um backend opcional do PWA exportado. A configuração fica por projeto em Publicação → Backend e acesso e é incorporada ao ZIP somente quando o backend Supabase está ativado.

O frontend aceita apenas Project URL e Publishable Key. Chaves `sb_secret_*`, `service_role`, senha do banco e outras credenciais administrativas são proibidas no PWA/ZIP/Git. A segurança de dados depende também de Auth e Row Level Security no Supabase.

## Publicação e Supabase

A tela Publicação está organizada em:

1. Preparar o projeto.
2. Backend e acesso.
3. Exportar o PWA.
4. Hospedar o aplicativo.

Em Backend e acesso é possível escolher Sem backend ou Supabase, informar Project URL + Publishable Key e usar Testar conexão. Projetos antigos continuam com backend desligado por padrão. Se o backend estiver desligado, a exportação remove a configuração Supabase do JSON público.

## Login por e-mail e código

Com Supabase ativo, a opção Exigir login por e-mail habilita autenticação no PWA exportado. O fluxo é:

1. Sem sessão válida: e-mail de acesso.
2. Supabase Auth envia OTP.
3. Cliente informa o código.
4. `verifyOtp` cria a sessão autenticada.
5. Enquanto a sessão continuar válida, novas aberturas entram direto sem repetir o login.

O pedido de OTP usa `shouldCreateUser: false`. Portanto, digitar um e-mail qualquer não cria uma conta nova. Nesta fase os usuários autorizados precisam existir previamente no Supabase; futuramente um webhook/API do checkout deverá criar ou conceder o acesso correspondente.

A prévia dentro do Appify simula o mesmo fluxo visual sem enviar e-mail e sem persistir sessão. Isso permite revisar UX e idioma sem disparar autenticações reais durante a edição.

### Configuração do e-mail OTP no Supabase

`signInWithOtp` pode usar Magic Link conforme o template do projeto. Para o fluxo de código numérico do Appify, o template de autenticação por e-mail precisa exibir o token OTP (`{{ .Token }}`). Essa configuração é feita no painel do Supabase, em Authentication → Email Templates.

### Envio do código e SMTP de produção

O SMTP padrão do Supabase serve para desenvolvimento e testes, mas não deve ser considerado a solução definitiva de produção para compradores reais. Antes de vender um produto, configurar um provedor transacional próprio no Supabase Auth.

Modelo recomendado para a primeira versão comercial:

1. Supabase Auth gera o OTP.
2. Um provedor SMTP transacional entrega o e-mail.
3. O remetente usa domínio próprio do produto ou da operação.
4. O cliente recebe um código numérico simples e confirma no PWA.

Resend é uma opção recomendada para validação inicial por oferecer SMTP e plano gratuito compatível com baixo volume. Brevo e Mailjet são alternativas. O provedor pode ser trocado depois sem refazer a tela de login do PWA.

É possível usar o mesmo domínio da página de vendas para o e-mail. Exemplo: site em `thelastrestart.com` e remetente `acesso@thelastrestart.com`. O site continua hospedado normalmente; os registros de e-mail são configurados no DNS em paralelo. Pode-se também usar um subdomínio técnico de envio, como `send.thelastrestart.com`.

Para boa entregabilidade, configurar no DNS os registros exigidos pelo provedor, incluindo SPF e DKIM; DMARC é recomendado. Não armazenar senha SMTP, API key do provedor ou segredo equivalente no ZIP/PWA. Credenciais de SMTP pertencem à configuração segura do Supabase/provedor, nunca ao frontend exportado.

UX recomendada para o público final: informar que o código pode levar alguns instantes, sugerir verificar Spam/Lixo eletrônico e disponibilizar Reenviar código com intervalo controlado. O fluxo por código numérico é preferido ao uso exclusivo de Magic Link para reduzir dependência de links e facilitar o uso por público menos técnico.

## Regras de acesso

Immediate, Drip e Upsell são avaliados em módulos e aulas no runtime e na prévia do telefone. Continuar de onde parei também passa pela mesma validação e não pode furar um bloqueio.

- Immediate: conteúdo liberado.
- Drip: conteúdo bloqueado até o prazo configurado.
- Upsell/locked: conteúdo bloqueado e, quando houver URL HTTPS válida, oferece ida ao checkout.
- Points: o bloqueio visual existe, mas o motor de pontos persistente ainda não deve ser tratado como liberação comercial completa.

Nesta versão, o Drip usa a data do primeiro acesso registrada no navegador/dispositivo. Não usa ainda data de compra verificada. Quando existir entitlement de compra no backend, o timestamp deverá vir do servidor.

## Limites de segurança atuais

Login Supabase autentica identidade; ainda não autentica compra. Não existe ainda integração automática com Hotmart, Stripe ou outro checkout, nem tabela/serviço de entitlements concluído nesta etapa.

O ZIP do PWA é frontend público e pode conter conteúdo estático empacotado. Por isso, login não é DRM. Conteúdo que exija proteção real deverá futuramente ser buscado do backend somente depois da validação de sessão + entitlement.

Nunca colocar Secret Key, `service_role`, senha de banco, senha SMTP, API key privada de e-mail, segredo de webhook ou token administrativo no Appify exportável, `app-data.json`, HTML das aulas, ZIP ou Git.

## Próximas etapas planejadas

1. Persistir perfil do usuário (`profiles`) com nome e e-mail de identidade somente leitura.
2. Avatar em Supabase Storage com políticas RLS por usuário.
3. Ação Sair deste dispositivo.
4. Configurar e validar SMTP próprio para OTP antes do primeiro produto comercial.
5. Entitlements por produto.
6. Webhook/API genérico para checkout (Hotmart, Stripe ou outro provedor).
7. Fazer Drip usar timestamp confiável do backend quando houver compra/acesso concedido.
8. Sincronizar progresso entre dispositivos, se necessário.

## Validação

A branch deve passar:

```sh
npm ci
npm run check:secrets
npm audit --audit-level=low
npm run lint
npm test
npm run build:pwa
npm run build
```

Além da automação, validar manualmente no Appify e em um PWA publicado: acesso aberto sem regressão, login ativado, envio de OTP para usuário existente, código inválido/expirado, retorno com sessão válida, logout quando implementado, idiomas PT/EN/ES/FR, Drip em módulo e aula, exportação sem credenciais privadas e entrega real do OTP pelo SMTP configurado antes da produção.

# Abertura, login e instalação do produto — Appify 0.9 Local

Atualizado: 12/10/2026.

## Experiência de entrada

O PWA suporta dois comportamentos de entrada por projeto:

- **Acesso aberto:** mantém o fluxo de boas-vindas/instalação opcional e abre o conteúdo sem autenticação.
- **Login por e-mail:** disponível quando Publicação → Backend e acesso usa Supabase e a opção Exigir login por e-mail está ativada.

Projetos existentes continuam em acesso aberto por padrão. Nenhum projeto antigo passa a exigir login automaticamente.

## Login Supabase

No primeiro acesso sem sessão válida:

1. O cliente informa o e-mail associado ao acesso.
2. O PWA solicita um OTP ao Supabase Auth.
3. O cliente digita o código recebido por e-mail.
4. A confirmação cria uma sessão autenticada.
5. Enquanto a sessão permanecer válida, as próximas aberturas entram direto sem repetir o login.

O Appify usa `signInWithOtp` com `shouldCreateUser: false`. Um e-mail desconhecido não deve criar conta automaticamente. O login autentica uma identidade já existente no Supabase; nesta etapa ele ainda não confirma que houve pagamento em Hotmart, Stripe ou outro checkout.

Para receber um código numérico, o template de autenticação por e-mail do Supabase deve incluir o token OTP (`{{ .Token }}`). Caso o template permaneça configurado apenas como Magic Link, o fluxo de seis dígitos do Appify não corresponde ao e-mail enviado.

A prévia do Appify simula e-mail e código sem fazer requisições reais e sem salvar sessão. Isso evita disparar mensagens durante a edição.

## Instalação

- Listener de `beforeinstallprompt` é inicializado antes de montar a interface e carregar dados.
- Botão de instalação direta aparece somente quando há evento real disponível.
- Aceitar o prompt não é tratado como instalação concluída; `appinstalled` ou modo standalone/fullscreen confirmam a instalação.
- Sem prompt: são exibidas instruções apropriadas para Chrome/Android, Safari/iOS, navegadores desktop e janelas embutidas.
- Instalação é opcional e não pode contornar o login: se a autenticação estiver ativada, concluir/pular a instalação retorna ao fluxo de acesso em vez de liberar o conteúdo.
- PT, EN, ES e FR incluem o fluxo de login, código e instalação.

## Abertura personalizada

A abertura pode usar marca ou mídia configurada. MP4 toca sem som, pode ser pulado e possui limite de segurança; erro ou autoplay bloqueado volta para a marca. GIF/WebP/imagens respeitam ajuste de preenchimento e fundo. A abertura não substitui autenticação.

Para uma sessão Supabase já válida, o PWA pode seguir direto para o conteúdo sem repetir a tela de login.

## Backend e publicação

Publicação agora inclui uma etapa **Backend e acesso** antes da exportação. O projeto pode ficar sem backend ou usar Supabase com Project URL + Publishable Key. Há um botão Testar conexão. Chaves secretas e `service_role` não podem ser usadas no PWA.

O ZIP leva a configuração pública somente quando Supabase está habilitado. A autenticação depende de internet; o restante do comportamento offline continua limitado aos recursos empacotados/cacheados.

## Relação com compra

Login e compra são responsabilidades diferentes. A autenticação atual prova que o usuário controla um e-mail cadastrado no Supabase. A liberação comercial confiável exigirá entitlement por produto e integração de checkout via webhook/API. A arquitetura não fica presa à Hotmart: Stripe ou outro provedor poderá alimentar o mesmo modelo de entitlement.

O conteúdo estático incluído no ZIP não deve ser considerado protegido por DRM apenas por haver uma tela de login. Conteúdo sensível deverá futuramente ser servido pelo backend depois da validação de sessão + entitlement.

## Regras de acesso relacionadas

Immediate, Drip e Upsell estão aplicados em módulos e aulas, tanto no preview quanto no runtime. Continuar de onde parei respeita esses bloqueios. O Drip desta versão conta dias a partir do primeiro acesso registrado no navegador/dispositivo; a data de compra real só poderá ser usada quando vier de um backend confiável.

## Verificação

Executar:

```sh
npm ci
npm run check:secrets
npm audit --audit-level=low
npm run lint
npm test
npm run build:pwa
npm run build
```

Teste manual recomendado: acesso aberto; login ativado; usuário existente; e-mail desconhecido; código correto/incorreto; reabertura com sessão; instalação antes/depois do login; PT/EN/ES/FR; Drip em módulo e aula; exportação sem credenciais privadas.

Para detalhes de arquitetura e próximos passos, consulte `docs/backend-access-auth-0.9.md`.

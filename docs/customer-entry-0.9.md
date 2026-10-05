# Abertura e instalação do produto — Appify 0.9 Local

Data: 05/10/2026. Escopo aprovado pelo usuário: teste no Android/Chrome, sem checkout por enquanto.

## Experiência

Primeiro acesso: identidade do produto → boas-vindas → acesso de demonstração → instalação opcional → conteúdo. Retornos abrem o conteúdo após a abertura breve com a marca, sem repetir o formulário ou bloquear em instalação. O editor tem uma prévia em Configurações Técnicas (PWA), com a mesma implementação usada no produto exportado.

O modo Demonstração é explicitamente identificado e não comprova compra, autentica ou protege arquivos. O e-mail é opcional, permanece somente na memória da tela, não é enviado nem salvo, e é descartado ao entrar. O modo Acesso aberto remove esse formulário. A validação real de compradores exige um backend e integração com o checkout; não foi implementada nesta etapa de teste.

## Instalação

- Listener de `beforeinstallprompt` inicializado antes de montar a interface e carregar dados. O evento disponível é mantido até o toque do usuário.
- Botão de instalação direta aparece somente quando há evento real disponível. Convite aceito não é tratado como instalação concluída; `appinstalled` ou modo standalone/fullscreen são os sinais utilizados.
- Sem evento: instruções do menu do Chrome no Android, compartilhamento do Safari no iOS, orientação para navegador externo em janelas embutidas e instruções de Chrome/Edge no computador.
- Cancelamento, falha e ausência de suporte não bloqueiam o conteúdo. Não há promessa de criar atalho automaticamente; a confirmação permanece controlada pelo navegador e pelo sistema.
- PT, EN, ES e FR completos; textos não fazem referência à cor de um botão. Layout com texto legível, controles grandes, rolagem e altura dinâmica do viewport.

## Atualizações e offline

Cada exportação recebe identificador de cache novo. Service worker usa rede primeiro e cache como fallback offline; somente arquivos públicos conhecidos do pacote são cacheados. Endpoints de API ficam fora da lista. `_headers` pede revalidação de HTML, dados, manifest e service worker. Isso reduz a chance de uma publicação nova continuar mostrando a interface anterior. A correção anterior de cópia do template também integra a branch local.

## Netlify

O selo é injetado pelo Netlify, não pelo Appify. Desativar no projeto: Project configuration → General → Powered by Netlify badge → Off → Save. A alteração não exige novo deploy. Referência: https://docs.netlify.com/manage/projects/powered-by-netlify-badge/

## Verificação

`npm test`, `npm run lint`, `npm run build`, `npm run check:secrets` e `npm run check:secrets -- --build`.

Testes simulam evento capturado antes de montar a UI, consumo único, aceitação sem falso sucesso, cancelamento, falha, ausência do evento, orientação por plataforma, navegação entre telas, acesso sem instalação, retorno ao conteúdo, não persistência do e-mail, traduções, rede/cache e preservação dos testes anteriores de editor e segurança.

Ainda é necessário validar no Android/Chrome real e no instalador Windows. Sem o URL do produto não foi possível inspecionar o manifest, os ícones e o service worker do deploy atual.

## Roteiro do teste final

1. Atualizar o Appify e gerar/instalar o novo instalador.
2. No projeto, selecionar o modo Demonstração em Configurações Técnicas (PWA), conferir logotipo e nome em Identidade e testar a abertura na prévia.
3. Exportar ZIP novo e publicar no mesmo projeto Netlify.
4. No Chrome Android, testar boas-vindas, acesso, instalação e abrir pelo ícone. Se a interface antiga persistir, limpar os dados desse site no navegador antes de testar novamente; isso também remove o progresso local existente.
5. Testar continuar no navegador, cancelar instalação e retornar ao conteúdo.
6. Abrir pelo ícone e verificar que a ajuda de instalação não reaparece.

## Publicação e recursos opcionais por projeto

Publicação → Deploy & Domínio oferece Netlify por padrão e Cloudflare Pages como alternativa. No Netlify, extraia o ZIP e publique a pasta que contém `index.html` na raiz. Para atualizar, use Deploys do mesmo projeto. O domínio personalizado é opcional e configurar o endereço no editor não altera DNS no provedor.

Configurações Técnicas (PWA) → Recursos opcionais do projeto tem interruptores de Engajamento e Gamificação. As escolhas são persistidas na configuração de cada projeto. Desligar oculta as abas do editor, sem apagar ajustes, avisos ou conteúdo. Reativar recupera os ajustes. Projetos anteriores mantêm Engajamento ligado até uma escolha explícita do proprietário.

Engajamento desligado remove comunidade, avisos, sino e banners de notificação da prévia e do runtime exportado; os módulos de aulas continuam no Início. Gamificação desligada remove pontos, streaks, celebrações, barras e anéis de progresso e o tempo de espera de conclusão. A exportação também desativa os sinalizadores filhos e remove a lista de prêmios do JSON público, sem alterar o projeto salvo.

A gamificação existente ainda contém números de demonstração. Esta etapa permite desligá-la; não implementa um motor real de conquistas nem serviço real de push.

Testes de interface verificam interruptores, restauração de ajustes, troca de configuração de projetos, navegação da prévia/runtime e seleção de provedor de publicação. Fontes das instruções: https://docs.netlify.com/deploy/create-deploys/ e https://docs.netlify.com/manage/projects/powered-by-netlify-badge/.

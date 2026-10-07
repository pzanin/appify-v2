# HTML interativo isolado e containers — Appify 0.9.1

## Como usar

Na aula HTML, abra Código HTML e escolha Tipo de HTML → Interativo isolado. Importe um `.html` ou cole o código completo, confira a prévia e salve a aula. A opção é salva por aula e usada na prévia do celular e no PWA exportado. O modo estático continua sendo o padrão dos projetos anteriores.

Há um botão para limpar escapes e URLs em Markdown de código copiado. A importação de arquivo também faz essa limpeza. Não substitui a correção de erros de lógica ou sintaxe do arquivo.

O arquivo `docs/examples/interactive-breathing.html` é uma atividade de exemplo em espanhol, com três ritmos, iniciar/pausar/reiniciar, contagem de ciclos completos, CSS Tailwind e SVG. É um exemplo técnico de interação, sem integração com autenticação ou serviço de saúde.

## Suporte desta primeira versão

- HTML, CSS inline, JavaScript inline e eventos de botões da própria atividade.
- Tailwind padrão convertido pelo compilador local instalado, incluindo classes literais no HTML e nos scripts. Cores e famílias de fontes em `tailwind.config.theme.extend` são lidas como dados por JSON5; a configuração nunca é executada no editor.
- CSS compilado e preflight incluídos no documento, sem CDN. A compatibilidade não é irrestrita entre versões do Tailwind: configurações com plugins, funções ou outras personalizações são rejeitadas com orientação para trazer CSS pronto. Classes criadas dinamicamente por concatenação precisam de CSS próprio ou nomes literais completos.
- Imagens, áudio e fontes embutidos como dados; fontes externas não são baixadas. O navegador usa as fontes locais disponíveis.
- Avisos para recursos externos, caminhos relativos e APIs incompatíveis. Erros de execução são apresentados na prévia quando reportados pela atividade.
- Layout original preservado, sem aplicar as regras gerais que forçam dimensões de SVG, grids ou flex. Rolagem vertical é permitida para evitar cortar controles em telas curtas.

Não há rede por fetch/XHR, bibliotecas JavaScript externas, iframes internos, cookies ou acesso ao armazenamento nativo do host. Atividades com localStorage usam uma ponte controlada para histórico local, descrita abaixo. A navegação de um documento não é uma conexão de API, e o isolamento não deve ser descrito como uma garantia absoluta de ausência de qualquer requisição do navegador. Não há acesso aos projetos, arquivos ou API do Appify. O login segue sendo demonstração e o Perfil não foi alterado.

## Isolamento

A atividade é exibida em iframe `sandbox="allow-scripts"`, sem `allow-same-origin`, formulários, popups, navegação do topo ou acesso ao host. Não recebe a ponte que abre links externos dos HTMLs estáticos. Mensagens recebidas só são aceitas da janela do iframe e, no modo interativo, aceitam erro textual limitado e o protocolo de armazenamento por atividade, com validação e limites.

No desktop, documentos temporários são servidos pelo protocolo `appify-content` com URL aleatória, CSP próprio e sandbox no cabeçalho. O protocolo não resolve caminhos do disco, não contorna CSP, limita tamanho/quantidade e elimina documentos ao fechar a prévia/janela. IPC de criação/remoção mantém a verificação existente de janela e frame principal. O preload continua expondo a API somente no frame principal. A política de scripts do editor não foi liberada.

No PWA, a aula carrega o documento compilado em `pages/` em iframe opaco, sem recompilar CSS no celular. Esses arquivos recebem CSP e sandbox por arquivo em `_headers` no Netlify, inclusive em visitas diretas. É necessário publicar com esses cabeçalhos; outros provedores devem receber configuração equivalente. HTML estático mantém seu CSP próprio, sem adicionar sandbox ao acesso direto. Credenciais continuam sendo bloqueadas na exportação.

## Containers

- Novo **1 Coluna**, com título, texto, fundo, espaço interno, arredondamento e tipografia.
- Largura máxima do conteúdo, com 0 para usar toda a largura.
- Margens acima e abaixo da seção.
- Cards de 2/3 colunas com alinhamento vertical no topo, centro, base ou mesma altura. O padrão continua no topo.
- Valores são normalizados e preservados ao salvar. A responsividade dos containers existentes e seus controles anteriores continuam cobertos por testes.

Esta é uma seção pronta de título/texto. Não é um sistema de containers aninhados com arraste livre de elementos como o Elementor.

## Validação

`npm test`, `npm run lint`, `npm run test:interactive`, `npm run check:secrets` e `npm run check:secrets -- --build`.

Os testes verificam interações de timer/modos/reset, compilação local de CSS, correção de cópia, restrições de recursos e configurações, persistência por aula e propriedades dos containers. O teste Electron/Chromium abre uma atividade sob a CSP de produção do editor e verifica cor/dimensões reais e bloqueios de DOM do pai, armazenamento, Node e API do Appify.

Instalador esperado após `npm run build:win`: `release/Appify-Setup-0.9.1.exe`.

Antes de usar com clientes, testar o instalador Windows e o PWA publicado no Android/Chrome, em tela pequena, sem internet e após trocar de aula. Integração com checkout, persistência de progresso e mais bibliotecas são etapas separadas.

Referências: https://www.electronjs.org/docs/latest/api/protocol e https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe.

## Histórico local de atividades

HTMLs com `localStorage.getItem/setItem/removeItem/clear/key/length` recebem uma fachada compatível, carregada antes dos scripts inline e seus eventos de inicialização. Não é necessário reescrever esses HTMLs. `sessionStorage`, cookies, acesso ao DOM do pai e armazenamento nativo continuam bloqueados. Scripts de módulo e bibliotecas externas não fazem parte desta compatibilidade.

O host determina a chave com produto, aula e ambiente (prévia ou cliente). A atividade não pode escolher o namespace do host nem ler outros projetos, aulas ou dados do editor. As mensagens só são aceitas do iframe corrente. Limites: 100 chaves por atividade, 128 caracteres por chave, 64 mil por valor e 256 mil caracteres no conjunto serializado; no máximo 30 gravações por segundo. Registros fora desses limites são rejeitados sem substituir os anteriores.

A escrita atualiza a memória da atividade imediatamente e é persistida pelo host via mensagem; `appify:storage-status` informa `{saved: boolean}` após a resposta. Falhas de permissão, espaço ou limite exibem aviso fora do HTML, inclusive se ele suprimir exceções. A atividade continua aberta. Não se deve interpretar a escrita síncrona como confirmação de persistência antes da resposta. Fechar abruptamente o processo pode perder a última escrita ainda em trânsito.

O botão do Appify **Limpar histórico desta atividade** pede confirmação e apaga apenas os dados dessa aula, reiniciando-a. Ele também funciona para HTMLs cujas confirmações nativas são bloqueadas pelo sandbox. A exclusão individual existente no HTML continua funcionando via `removeItem` ou atualização de `setItem`.

Os dados ficam no navegador/perfil deste aparelho, sem Supabase, sincronização ou inclusão no ZIP e no backup do projeto. Limpar os dados do site apaga o histórico. Trocar a hospedagem/domínio cria outro armazenamento. A prévia do editor e do celular compartilham o histórico de teste do projeto; o PWA publicado mantém o histórico dos clientes separado. Reexporte e publique o ZIP após atualizar o Appify para incorporar a ponte.

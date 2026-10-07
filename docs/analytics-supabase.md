# Analytics mínimo do Appify

Três métricas, por projeto e período: aberturas de aulas, conclusões marcadas e cliques nos botões de checkout dos módulos e nos blocos Arquivo para download. Sem retenção, tempo de consumo, instalação ou contagem de usuários. Cliques não comprovam vendas.

## Estado da implementação

O painel, a coleta no PWA, o SQL e a Edge Function estão preparados. Nenhum banco foi criado ou conectado automaticamente. Sem configurar e implantar o backend, não há dados reais. O Appify continua salvando seus projetos localmente; o Supabase serve somente para receber interações e consultar relatórios.

## Ativação, uma vez no Supabase

1. Criar um projeto Supabase para Analytics. Criar sua conta de proprietário em Authentication (e-mail e senha). Não permitir cadastro público para o painel de proprietário. A conta não é a dos compradores.
2. Aplicar `supabase/migrations/20261007140000_appify_analytics.sql` pelo SQL Editor. A migração é aditiva, usa tabelas próprias e deve ser executada uma única vez. Não modifica tabelas de autenticação de compradores.
3. Implantar a função `supabase/functions/analytics-ingest`. Com Supabase CLI instalada e autenticada, na raiz do repositório:

   ```sh
   supabase link --project-ref SEU_PROJECT_REF
   supabase db push
   supabase functions deploy analytics-ingest --no-verify-jwt
   ```

   Use SQL Editor **ou** migração via CLI, não aplique o mesmo SQL duas vezes. A função pública faz validação própria. `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são variáveis do ambiente da Edge Function; nunca colocá-las como chaves administrativas no Appify, ZIP ou frontend.
4. Em Analytics → Configurar Supabase, preencher a URL do projeto e a chave pública publishable/anon. Criar o identificador do projeto. Entrar usando a conta de proprietário.
5. Em Publicação → Testar no celular, informar o endereço HTTPS da hospedagem. Em Analytics, clicar em Registrar / atualizar projeto no backend. A origem HTTPS é vinculada ao projeto (inclui host e eventual porta, sem caminho). Se a hospedagem mudar, atualizar o registro antes de reexportar.
6. Ativar a coleta, salvar e reexportar o PWA. Atualizar o mesmo projeto na hospedagem.
7. Para materiais existentes, reabrir e salvar as aulas no Builder: isso inclui o identificador do material no HTML. A medição de materiais cobre o bloco Arquivo para download no HTML estático do Builder; links arbitrários e HTML interativo importado não são classificados automaticamente.
8. Abrir uma aula no celular, marcar Concluir e clicar num material ou checkout configurado. Entrar nos relatórios e clicar em Atualizar dados.

## Como as contagens funcionam

- Abertura: cada entrada na aula no PWA. Testes no Builder e na simulação não enviam eventos. Acessos de teste feitos no próprio PWA hospedado contam.
- Conclusão: uma por instalação e aula. O banco deduplica novas marcações do mesmo navegador. Uma instalação não identifica uma pessoa; limpar o armazenamento ou trocar de dispositivo gera outro identificador.
- Clique: cada acionamento do botão de checkout de um módulo bloqueado/upsell ou de um material identificado. Não envia a URL do arquivo ou checkout, nem comprova download/compra.
- Períodos: janelas móveis de 24 horas, 7, 30 ou 90 dias, usando a hora de recebimento do servidor.
- Sem internet, bloqueadores ou falha do serviço, o evento pode não chegar. Não há fila offline ou repetição automática nesta versão. O conteúdo e os links continuam funcionando.
- Os dados não são históricos retroativos. Começam após a ativação no PWA reexportado.

## Proteções e limites

O PWA envia só identificadores aleatórios e identificadores de conteúdo. Não envia nome, e-mail, IP, URL, senha nem credenciais administrativas. A função não grava IP, embora a infraestrutura do provedor possa ter seus próprios logs de requisições.

O coletor aceita somente oito campos validados e corpo de até 2 KB. Exige projeto ativo e origem HTTPS cadastrada. O banco limita 30 eventos/minuto por instalação, 1.000/minuto por projeto e 10.000/dia UTC por projeto. O limite é serializado no banco para valer entre instâncias. Eventos repetidos por ID e conclusões duplicadas não incrementam o relatório.

A origem e o identificador público não autenticam compradores: um cliente determinado pode fabricar eventos. São métricas de orientação, não registros financeiros nem evidência de acesso autorizado.

Tabelas com RLS, sem leitura ou inserção anônima. A Edge Function usa a chave administrativa somente no servidor. A função de ingestão só é executável por `service_role`. Consultas exigem login do proprietário e respeitam RLS por projeto. A sessão do proprietário fica apenas em memória, não é persistida em projeto, backup, ZIP ou armazenamento do navegador.

Antes de ativar em produção, validar no Supabase real: anônimo não lê/inserta diretamente, outro proprietário não vê os relatórios, a origem incorreta é recusada, duplicatas não contam duas vezes e o celular envia os três eventos. Essa validação não pode ser feita sem um projeto Supabase conectado.

Referências oficiais: https://supabase.com/docs/guides/database/postgres/row-level-security e https://supabase.com/docs/guides/functions/auth.

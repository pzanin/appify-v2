# Appify 0.9 Local — revisão do editor HTML

Data: 05/10/2026. Branch: feature/appify-0.9-local-foundation.

## Correções e melhorias

- Geração de conteúdo compartilhada entre canvas e HTML salvo, com normalização dos blocos antigos sem alterar os dados originais.
- Fontes selecionadas carregadas no editor; estilo de título separado do texto/subtítulo. Tamanho, peso e margem são preservados no HTML salvo.
- Campos numéricos junto aos sliders para definir valores exatos. Valores zero de padding, raio e margem não são substituídos pelo padrão.
- Controles de mover/excluir com botões acessíveis e ícones de tamanho fixo; mover além dos limites fica desabilitado. Duplicação cria outro ID e outra cópia das propriedades.
- Removido o padding extra do preview. Cards usam colunas com largura flexível e altura baseada no conteúdo; em containers de até 600 px, empilham em uma coluna. Espaçamento entre cards e arredondamento editáveis.
- Altura explícita de imagens do builder deixa de ser anulada pela regra responsiva. Largura, proporção automática, recorte e raio continuam configuráveis.
- Links do CTA e botão seguem a validação externa HTTPS/mailto. Domínio sem protocolo recebe HTTPS. URLs inválidas ficam inativas; botão separado permite testar o endereço no navegador, sem navegar para fora do editor ao selecionar o bloco.
- Conteúdo textual é escapado e preserva quebras de linha. HTML personalizado continua no modo Código, com sanitização, CSP e iframe isolado.

## Verificação

`npm test` inclui testes de títulos nos seis tipos de blocos, imagens, cards, links, defaults antigos, reordenação e geração de todos os 12 blocos. O teste do componente opera os controles de fonte/tamanho, duplica com propriedades independentes, move, salva no store e reabre a aula. Os testes anteriores de persistência e segurança continuam no mesmo comando.

Rodar antes de integrar: `npm run lint`, `npm test`, `npm run build`, `npm run check:secrets` e `npm run check:secrets -- --build`.

Os testes DOM verificam comportamento e HTML, sem medir o layout real de um navegador. A aparência e instalação Windows exigem validação manual. Fontes Google precisam de rede; sem rede, usam a fonte de fallback sans-serif.

## Teste manual no Windows

1. Abrir uma aula antiga sem salvar e conferir se os dados continuam disponíveis.
2. Em Hero, cabeçalho, CTA, duas/três colunas e imagem+texto: trocar fonte do título, tamanho para 37 px, peso e margem para zero. Salvar, sair e reabrir.
3. Alterar o tamanho do texto para 60 px: ícones de mover/duplicar/excluir devem continuar pequenos. Duplicar um bloco, editar a cópia, mover e excluir a cópia; original deve permanecer.
4. Cards com textos de tamanhos diferentes: conferir leitura no celular, raio zero e espaço entre cards. Não deve haver rolagem horizontal.
5. Imagem: configurar largura 55%, altura 180 px, contain e raio zero; repetir em imagem+texto. Conferir editor e PWA exportado.
6. CTA e botão: testar endereço Hotmart pelo botão de teste. Selecionar o bloco no canvas não deve abrir o checkout. No PWA exportado, o link deve abrir o navegador.
7. Importar um HTML separado no modo Código; salvar e reabrir para conferir sua preservação.
8. Exportar ZIP, abrir no celular e conferir os mesmos títulos, cards, imagens e links.

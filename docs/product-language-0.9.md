# Idioma do produto — revisão 0.9.1

A interface do produto usa `pwaConfig.language`, independentemente de `builderLocale`. As telas de carregamento e falha antes de ler app-data usam o `lang` do index.html exportado. O fallback das traduções é inglês; todos os quatro catálogos são verificados quanto a chaves e variáveis de interpolação.

Correções: conclusão de aula, mensagem de upgrade, títulos de iframe e imagens, preparação/erro de HTML interativo, falha de tela e recarga, contato de suporte ausente, rótulos de reprodução, datas do feed e placeholders de marca. A frase antiga “O melhor app do mundo” é tratada como placeholder, usando a descrição traduzida da abertura. “Meu App”, quando usado como nome padrão, é apresentado no idioma do produto.

Novos blocos são preenchidos no idioma do produto. Os avisos e rótulos gerados dos blocos visuais são regenerados na prévia e na exportação com esse idioma. HTML importado, títulos, conteúdo, legendas, nomes de autores e textos já salvos não são traduzidos nem substituídos. Assim, projetos com blocos antigos preenchidos em português exigem revisão editorial do autor.

Datas novas guardam um instante numérico e são formatadas no idioma do produto. Datas antigas no formato dd/mm/aaaa e a indicação “Agora mesmo” são reconhecidas e apresentadas no idioma escolhido. Datas/textos personalizados permanecem como conteúdo do autor.

Testes de regressão incluem produto em inglês com editor em português: abertura, instalação, perfil, suporte, comunidade, ofertas, aulas, conclusão, mensagens de atividade, carregamento sem app-data e falha de tela. Também verificam os defaults dos blocos e a preservação do texto do autor. Estes são testes automatizados de componentes e geração de HTML; não substituem a verificação do produto publicado no celular.

Atualizações do runtime só chegam ao produto já hospedado após gerar e publicar um novo ZIP.

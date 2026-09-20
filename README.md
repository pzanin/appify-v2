# Appify 0.9 Local

Criador privado de PWAs em Electron. Os projetos do construtor são salvos em disco; Supabase é opcional e pertence apenas aos PWAs gerados.

## Run Locally

**Pré-requisitos:** Node.js 22+.


1. Instale as dependências:
   `npm install`
2. Execute o aplicativo Electron:
   `npm run dev`

No Windows, os projetos ficam por padrão em:

`Documentos/Appify/Projects/NomeDoProjeto-ID/`

Cada projeto contém `project.json`, `assets/`, `pages/` e `build/`.

## Instalar no Windows

1. Feche o Appify e execute `npm run build:win` na pasta do projeto.
2. Aguarde a criação de `release/Appify-Setup-0.9.0.exe`.
3. Abra o instalador e mantenha marcada a criação do atalho na Área de Trabalho.
4. Depois da instalação, abra o Appify pelo atalho ou pelo menu Iniciar. Não será mais necessário executar `npm run dev`.

Os projetos continuam em `Documentos/Appify/Projects`, portanto instalar uma nova versão não apaga os projetos locais.

## Verificações

- `npm run lint`: validação TypeScript (a branch atual ainda possui erros legados fora da fundação local).
- `npm run build`: compila renderer, processo principal e preload.
- `npm run build:pwa`: recompila o template exportável do PWA.
- `npm run build:app` ou `npm run build:win`: gera o instalador Windows com ícone e atalhos; execute no Windows ou em CI com o ambiente de empacotamento adequado.

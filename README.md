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

## Verificações

- `npm run lint`: validação TypeScript (a branch atual ainda possui erros legados fora da fundação local).
- `npm run build`: compila renderer, processo principal e preload.
- `npm run build:pwa`: recompila o template exportável do PWA.
- `npm run build:app`: gera o instalador Windows; execute no Windows ou em CI com o ambiente de empacotamento adequado.

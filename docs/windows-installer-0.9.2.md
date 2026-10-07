# Instalador Windows — Appify 0.9.2

O instalador NSIS para Windows x64 inclui o editor desktop, Electron e o template PWA compilado. Não precisa de Node, npm, terminal ou Supabase para ser usado depois de instalado. Cria atalhos na área de trabalho e no menu Iniciar e permite escolher a pasta de instalação.

## Gerar na máquina Windows

Use Node 24 LTS, versão 24.15 ou superior, e execute `gerar-instalador.cmd` na raiz do repositório atualizado. O script instala as dependências do lockfile, roda lint, testes, verificações de credenciais e auditoria de dependências, compila desktop/PWA e gera `release/Appify-Setup-0.9.2.exe`. Também é possível usar `npm ci` seguido de `npm run build:win`.

A geração verifica a auditoria com severidade mínima low e para se um check falhar. A dependência `@electron/get` foi unificada na versão 5.1.0, compatível com o Node suportado e sem a cadeia antiga de global-agent/roarr/sprintf-js. A exportação de PWA continua bloqueando credenciais privadas.

## Instalar e conferir

Feche o Appify antes de instalar. A identidade do aplicativo foi mantida (`com.pzanin.appify`) para atualizar a instalação existente. Os projetos ficam em `Documentos/Appify/Projects`, fora da pasta de instalação; o pacote não inclui projetos pessoais. Use o recurso de backup dos projetos antes de atualizar.

Abra pelo atalho e confira salvar/reabrir um projeto, importar HTML interativo, salvar/reabrir histórico, produto em inglês com editor em português e exportar um ZIP completo com pages e template PWA. A versão inclui as melhorias atuais; o acabamento de produção, retirada de todas as simulações e revisão completa de iPhone são trabalhos separados, ainda não concluídos.

O instalador não tem certificado de assinatura digital. O Windows pode exibir aviso de editor desconhecido. A criação do arquivo e inspeção do pacote não equivalem a um teste de execução do instalador numa máquina Windows.

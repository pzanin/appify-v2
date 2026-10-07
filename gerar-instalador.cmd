@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto missing_node
node scripts\check-build-node.mjs
if errorlevel 1 goto failed
call npm ci
if errorlevel 1 goto failed
call npm run build:win
if errorlevel 1 goto failed
echo.
echo Instalador gerado na pasta release. Abra o arquivo Appify-Setup-0.9.2.exe.
start "" explorer.exe "%CD%\release"
pause
exit /b 0
:missing_node
echo Instale Node 24 LTS em https://nodejs.org/ e tente novamente.
:failed
echo.
echo A geracao parou. Confira a mensagem acima; nao use arquivos antigos da pasta release.
pause
exit /b 1

@echo off
title Controle de Ferias - DIA A DIA ;DD
echo ============================================
echo    CONTROLE DE FERIAS - DIA A DIA ;DD
echo ============================================
echo.

:: Get the local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    set IP=%%a
)
set IP=%IP: =%

echo  Iniciando o servidor...
echo.
echo  Acesse no seu computador:
echo    http://127.0.0.1:8000
echo.
echo  Compartilhe com seu gestor (mesma rede):
echo    http://%IP%:8000
echo.
echo  Para encerrar, feche esta janela.
echo ============================================
echo.

cd /d "%~dp0"
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
pause

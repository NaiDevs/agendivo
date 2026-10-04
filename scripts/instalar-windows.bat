@echo off
setlocal

set "DIR=%~dp0"
set "INSTALLER="

for %%f in ("%DIR%..\Agendivo_*_x64-setup.exe") do set "INSTALLER=%%f"

if "%INSTALLER%"=="" (
    echo No se encontro el instalador de Agendivo en esta carpeta.
    echo Asegurate de que el archivo .exe este junto a este script.
    pause
    exit /b 1
)

echo Preparando instalacion de Agendivo...
powershell -ExecutionPolicy Bypass -Command "Unblock-File -Path '%INSTALLER%'"

start "" /wait "%INSTALLER%"

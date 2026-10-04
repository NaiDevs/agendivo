#!/bin/bash
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
DMG=$(find "$DIR/.." -maxdepth 1 -name "Agendivo_*.dmg" | head -1)

if [ -z "$DMG" ]; then
    echo "No se encontro el instalador de Agendivo (.dmg) en esta carpeta."
    read -p "Presiona Enter para salir..."
    exit 1
fi

echo "Preparando instalacion de Agendivo..."
xattr -dr com.apple.quarantine "$DMG"

echo "Abriendo instalador..."
open "$DMG"

echo ""
echo "Cuando se abra la ventana del instalador:"
echo "  1. Arrastra Agendivo a la carpeta Aplicaciones"
echo "  2. Cierra la ventana"
echo "  3. Expulsa el disco desde el Finder"
echo ""
echo "Despues del paso 1, ejecuta este comando en Terminal:"
echo "  xattr -cr /Applications/Agendivo.app"
echo ""
read -p "Presiona Enter para salir..."

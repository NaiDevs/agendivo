# Diseño — Respaldos y restauración (Fase 4)

Estado: implementado

## Objetivo

Permitir que la persona usuaria cree y restaure copias completas de la base
SQLite sin depender de internet ni manipular manualmente archivos internos.

## Respaldo

- La pantalla Configuración permite elegir la ubicación del archivo.
- SQLite genera una instantánea transaccional mediante `VACUUM INTO`.
- La instantánea se crea primero en el directorio privado de la aplicación y
  luego se copia al destino elegido.
- Los archivos temporales siempre se eliminan al terminar.

## Restauración

1. La persona selecciona un archivo `.sqlite` o `.db`.
   Esta acción está disponible tanto en Configuración como en la bienvenida
   de una instalación sin negocio configurado.
2. La aplicación valida la cabecera SQLite, `PRAGMA integrity_check` y las
   tablas obligatorias de la versión actual.
3. Se muestra un resumen del negocio y cantidades de registros antes de pedir
   confirmación.
4. Se crea una instantánea automática de la base actual.
5. Se cierra el pool SQLite, se reemplaza el archivo y se recarga el store.
6. Si cualquier paso falla después del reemplazo, la instantánea anterior se
   restaura automáticamente.

## Seguridad

- Las rutas se pasan como parámetros SQL; nunca se concatenan.
- El acceso permanente del filesystem se limita al directorio privado de la
  aplicación. Los destinos externos solo se habilitan al elegirlos mediante el
  diálogo nativo.
- No se aceptan archivos corruptos, bases genéricas ni versiones incompatibles.

## Fuera de alcance

- Respaldos automáticos programados.
- Sincronización en la nube.
- Cifrado con contraseña.
- Distribución e instaladores, correspondientes a la Fase 5.

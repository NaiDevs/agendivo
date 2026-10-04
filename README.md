# Agendivo

Aplicación de escritorio offline-first para gestionar negocios que trabajan mediante citas. El MVP usa Tauri 2, React, TypeScript y SQLite; no requiere un backend remoto.

## Funcionalidad disponible

- Configuración inicial del negocio.
- Registro y listado de clientes.
- Registro y listado de profesionales.
- Catálogo de servicios con duración y precio.
- Calendario mensual, semanal y diario.
- Creación, edición y cancelación de citas.
- Bloqueo de citas superpuestas por profesional.
- Registro de pagos, ligados a una cita o como venta suelta, con anulación.
- Registro de gastos por categoría, editables y con borrado lógico.
- Reportes financieros diario y mensual con desgloses y balance.
- Exportación de reportes a Excel (.xlsx).
- Impresión de recibos de pago.
- Respaldos y restauración segura de la base de datos.
- Persistencia local con migraciones SQLite.

## Requisitos

Comunes:

- Node.js LTS.
- pnpm 11 mediante Corepack.
- Rust estable mediante rustup.

Windows:

- Windows 10 u 11.
- Microsoft Edge WebView2 Runtime.
- Visual Studio Build Tools con la carga de trabajo **Desarrollo para el escritorio con C++**.

macOS:

- Una versión de macOS compatible con Tauri 2.
- Xcode Command Line Tools: `xcode-select --install`.

## Instalación

```bash
corepack enable
corepack prepare pnpm@11.18.0 --activate
pnpm install
```

La descarga de dependencias requiere internet únicamente durante la instalación. Después, la aplicación y SQLite funcionan sin conexión.

## Ejecutar en desarrollo

```bash
pnpm tauri dev
```

## Autenticación y Supabase

La Fase 6 incorpora autenticación opcional durante la transición desde la
versión local. Copia `.env.example` como `.env.local` y configura:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

Aplica en el proyecto Supabase la migración
`supabase/migrations/202608030001_auth_tenancy.sql`. Cuando ambas variables
están definidas, Agendivo exige una cuenta antes de abrir la base SQLite. Sin
ellas, la aplicación conserva el funcionamiento local de la versión 0.1.0.

En **Authentication → URL Configuration → Redirect URLs** agrega exactamente
`agendivo://auth/callback`. El instalador registra el esquema `agendivo://` en
Windows, macOS y Linux para que la confirmación por correo regrese a la app.

Las migraciones siguientes agregan la copia nube versionada y las suscripciones
de Stripe. Las claves privadas de Stripe se configuran únicamente como secretos
de Supabase; nunca forman parte del instalador.

## Verificaciones

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

Para validar Rust y la configuración de Tauri:

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

## Generar instaladores

Ejecuta el comando en el sistema operativo para el que quieres construir:

```bash
pnpm tauri build
```

Los artefactos se generan dentro de `src-tauri/target/release/bundle`.

En Windows se generan dos opciones:

- NSIS (`*-setup.exe`): instalación por usuario, recomendada para uso normal.
- MSI (`*.msi`): instalación administrada para todos los usuarios; requiere
  privilegios de administrador.

Los instaladores locales no están firmados digitalmente hasta configurar un
certificado de firma de código.

## Datos locales

SQLite se inicializa automáticamente como `agendivo.db` en el directorio de datos de la aplicación. Al actualizar una instalación anterior, Agendivo copia automáticamente la base heredada:

- Windows: `%APPDATA%\com.naide.agendivo\agendivo.db`
- macOS: `~/Library/Application Support/com.naide.agendivo/agendivo.db`

Las migraciones viven en `src-tauri/migrations` y se ejecutan una sola vez. Las migraciones aplicadas no deben modificarse; cualquier cambio de esquema requiere una migración nueva.

## Arquitectura

```text
UI React → store Zustand → servicios de dominio → interfaces de repositorio
                                                ↓
                                  repositorios SQLite / Tauri SQL
```

SQLite es la fuente principal de datos. Las entidades usan UUID, fechas UTC, borrado lógico y metadatos de versión/dispositivo para preparar una sincronización futura.

## Soporte

Consulta [SUPPORT.md](SUPPORT.md) o escribe a
[naidelynmaldonado54@gmail.com](mailto:naidelynmaldonado54@gmail.com).

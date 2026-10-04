# Changelog

Todos los cambios relevantes de Agendivo se documentan en este archivo.

## [Sin publicar]

## [0.2.0] - 2026-08-22

### Agregado

- Paywall obligatorio después de crear la cuenta y configurar el negocio; los módulos se habilitan únicamente cuando Stripe confirma una suscripción activa.
- Registro e inicio de sesión mediante Supabase Auth.
- Modelo multi-negocio protegido con Row Level Security.
- Sincronización bidireccional versionada de clientes, profesionales, servicios,
  citas y configuración fiscal.
- Stripe Checkout para suscripciones y webhook idempotente.
- Invitaciones y cuentas de acceso para profesionales.
- Campos personalizados de clientes con validación por tipo.
- Selección de múltiples servicios en citas y pagos.
- Emisión de factura fiscal desde un recibo existente.

### Cambiado

- Se incorporó la identidad visual oficial de Agendivo en la aplicación, los instaladores y la publicación del release.
- Los metadatos de sincronización por dispositivo ahora se separan por negocio.
- Los comprobantes conservan una copia de los servicios y datos fiscales emitidos.
- Se restringieron las conexiones remotas y los permisos de archivos del cliente.
- Stripe Checkout solo abre direcciones HTTPS oficiales de Stripe.

### Seguridad

- Supabase bloquea datos operativos e invitaciones de equipo cuando el negocio no tiene una suscripción pagada y vigente.
- Se actualizaron dependencias y la auditoría de producción no reporta vulnerabilidades conocidas.

### Migraciones

- Se agregan las migraciones SQLite `0010` a `0016`.
- Se agregan las migraciones Supabase para dispositivos por negocio, campos
  personalizados, múltiples servicios y control de acceso por suscripción.

## [0.1.0] - 2026-08-03

### Agregado

- Configuración inicial del negocio y persistencia local SQLite.
- Gestión de clientes, profesionales y servicios.
- Calendario y administración de citas con bloqueo de horarios superpuestos.
- Registro y anulación de pagos, gastos y saldos pendientes.
- Reportes diarios y mensuales con exportación a Excel.
- Impresión de comprobantes de pago.
- Respaldos y restauración con validación y rollback automático.
- Notificaciones globales y estados de carga animados.

### Distribución

- Instaladores Windows MSI y NSIS en español.
- Instalación NSIS por usuario y bloqueo de versiones anteriores.

### Seguridad de datos

- La aplicación funciona sin backend remoto y conserva los datos localmente.
- Las restauraciones validan integridad y compatibilidad antes de reemplazar la
  base activa.

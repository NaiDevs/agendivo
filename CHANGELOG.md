# Changelog

Todos los cambios relevantes de Nai Citas se documentan en este archivo.

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

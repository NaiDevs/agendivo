# Diseño — Pagos (Fase 3, entrega 1)

Fecha: 2026-08-03
Estado: aprobado, pendiente de implementación

## Contexto

Nai Citas (Turnivo) es una app de escritorio offline-first (Tauri 2 + React 19 +
TypeScript + SQLite) para gestionar negocios por citas. Las Fases 1 y 2 están
completas: negocio, clientes, empleados, servicios, citas y calendario con
validación de solapamiento.

Esta es la **primera entrega de la Fase 3 (Finanzas)** y cubre únicamente
**Pagos**. Gastos, reportes (diario/mensual), exportación e impresión de
comprobantes quedan explícitamente fuera de alcance y se abordarán en entregas
posteriores.

## Decisiones de diseño

- **Vínculo pago-cita:** cita opcional. `appointmentId` puede ser `null`
  (walk-in); `customerId` es obligatorio.
- **Pagos por cita:** varios pagos por cita (anticipos + saldos). Se calcula el
  saldo pendiente como `precio_cita − suma_pagos_activos`.
- **Métodos de pago:** enum fijo `CASH`, `CARD`, `TRANSFER`, `OTHER`.
- **Inmutabilidad:** los pagos no se editan. Se crean y se pueden **anular**
  (borrado lógico vía `deletedAt`). Nunca se eliminan físicamente. Honra las
  reglas del brief: "no sobrescribir pagos silenciosamente" y "los pagos no
  deben eliminarse físicamente".
- **Puntos de entrada:** pantalla Finanzas (Pagos) con lista + "Nuevo pago", y
  botón "Registrar pago" dentro de una cita existente mostrando el saldo.
- **Dinero:** en centavos (int), igual que `appointment.price`. Conversión con
  `Math.round(amount * 100)`.

## Modelo de datos

### Entidad `Payment` (`src/domain/entities/payment.ts`)

Extiende `SyncableEntity` (`id`, `createdAt`, `updatedAt`, `deletedAt`,
`version`, `deviceId`).

| Campo           | Tipo             | Notas                            |
| --------------- | ---------------- | -------------------------------- |
| `businessId`    | `string`         | UUID                             |
| `appointmentId` | `string \| null` | UUID, opcional (walk-in)         |
| `customerId`    | `string`         | UUID, obligatorio                |
| `amount`        | `number`         | centavos, entero > 0             |
| `method`        | `PaymentMethod`  | enum                             |
| `paidAt`        | `string`         | ISO UTC, default ahora, editable |
| `notes`         | `string \| null` | max 500                          |

### `PAYMENT_METHOD`

Objeto `as const` siguiendo el patrón de `APPOINTMENT_STATUS`:
`CASH = "cash"`, `CARD = "card"`, `TRANSFER = "transfer"`, `OTHER = "other"`.

### Migración `0006_payments`

- Tabla `payments` con las mismas convenciones de columnas snake_case que
  `appointments` (`business_id`, `appointment_id`, `customer_id`, `amount`,
  `method`, `paid_at`, `notes`, `created_at`, `updated_at`, `deleted_at`,
  `version`, `device_id`).
- Triggers `BEFORE INSERT` y `BEFORE UPDATE` (patrón de `0004`) que validan:
  - `customer_id` existe en `customers` del mismo `business_id` y sin borrar.
  - Si `appointment_id` no es `null`, existe en `appointments` del mismo
    `business_id` y sin borrar.
  - Códigos de error: `PAYMENT_CUSTOMER_INVALID`, `PAYMENT_APPOINTMENT_INVALID`.
- Índices en `business_id`, `customer_id`, `appointment_id`, `paid_at`.
- Archivo `.down.sql` que elimina triggers, índices y tabla.

## Dominio

### `PaymentRepository` (interfaz, `src/domain/repositories/`)

```
findActiveByBusiness(businessId: string): Promise<Payment[]>
findByAppointment(appointmentId: string): Promise<Payment[]>
create(payment: Payment): Promise<void>
void(payment: Payment): Promise<void>   // marca deletedAt
```

Sin `update`.

### `SqlitePaymentRepository` (`src/infrastructure/repositories/`)

Implementa la interfaz con `paymentRowSchema` (zod) para validar filas,
`mapPayment` y `paymentValues`, idéntico patrón a
`SqliteAppointmentRepository`.

### `payment.service.ts` (`src/domain/services/`)

- `createPayment(values, businessId, deviceId, repository)`:
  - Valida con `paymentFormSchema`.
  - Convierte `amount` a centavos.
  - Si hay `appointmentId`, valida que el monto no exceda el saldo pendiente
    (`precio_cita − suma_pagos_activos` de esa cita); si excede lanza
    `PaymentExceedsBalanceError`. El cálculo del saldo se hace con datos
    provistos por el store (precio de la cita + pagos activos), no consultando
    la DB dentro del servicio, para mantener el servicio puro y testeable.
  - Arma la entidad con UUID, `version: 1`, timestamps.
- `voidPayment(current, repository)`: marca `deletedAt`, incrementa `version`.

### Error `PaymentExceedsBalanceError` (`src/domain/errors/`)

Patrón de `AppointmentConflictError`.

## Estado (store)

`src/stores/app.store.ts`:

- Estado nuevo: `payments: Payment[]`, cargado en `initialize()` con
  `SqlitePaymentRepository.findActiveByBusiness` (dentro del `Promise.all`).
- `addPayment(values)`: mismo patrón que `addAppointment` (isSaving, error,
  actualiza el array ordenado por `paidAt` desc).
- `voidPayment(paymentId)`: mismo patrón que `cancelAppointment`.
- Helper `appointmentBalance(appointmentId)`: calcula saldo pendiente desde
  `payments` activos + `price` de la cita en memoria.

## Schemas

`src/schemas/payment.schema.ts`:

- `customerId`: uuid.
- `appointmentId`: `union("" | uuid)`, opcional.
- `amount`: number > 0, max 1.000.000.
- `method`: enum de `PAYMENT_METHOD`.
- `paidAt`: string, fecha válida.
- `notes`: string trim max 500.

Con `payment.schema.spec.ts`.

## UI

Nueva carpeta `src/features/payments/`:

- `payments-screen.tsx`: lista de pagos (fecha, cliente, cita si aplica, método,
  monto con `formatMoney`, botón **Anular** con confirmación) + botón
  **Nuevo pago**.
- `components/payment-form.tsx`: react-hook-form + zod. Selector de cliente,
  selector de cita opcional (filtrada por el cliente elegido), monto, método,
  fecha, notas. Al elegir cita muestra el saldo pendiente y pre-llena el monto
  con ese saldo.
- `components/payment-list.tsx`: el listado.

Integración en `src/features/appointments/components/appointment-form.tsx`:

- Bloque "Pagos" visible solo al **editar** una cita existente: muestra saldo
  pendiente y pagos ya registrados, con botón **Registrar pago** que abre el
  `payment-form` precargado con esa cita.

Wiring: conectar `APP_SECTION.PAYMENTS` en `src/app/app-shell.tsx` a la nueva
pantalla (hoy placeholder).

## Testing (Vitest)

- `payment.service.spec.ts`: crea pago; calcula saldo; rechaza monto que excede
  saldo; permite walk-in sin cita; anula pago.
- `payment.schema.spec.ts`: validaciones del form.
- Ampliar `sqlite-repositories.spec.ts` con el caso de `payments`
  (create + findByAppointment + void).

## Fuera de alcance

Gastos, reportes diario/mensual, exportación de reportes e impresión de
comprobantes. Se abordarán en entregas posteriores de la Fase 3.

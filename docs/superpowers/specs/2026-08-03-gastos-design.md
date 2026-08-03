# Diseño — Gastos (Fase 3, entrega 2)

Fecha: 2026-08-03
Estado: aprobado, pendiente de implementación

## Contexto

Segunda entrega de la Fase 3 (Finanzas) de Nai Citas. La entrega 1 (Pagos) ya
está completa. Esta cubre **Gastos**. Reportes, exportación e impresión quedan
fuera de alcance.

## Decisiones de diseño

- **Categoría:** enum fijo `EXPENSE_CATEGORY` (`SUPPLIES`, `RENT`, `UTILITIES`,
  `SALARIES`, `OTHER`) con etiquetas Insumos, Renta, Servicios, Sueldos, Otro.
- **Mutabilidad:** a diferencia de los pagos, los gastos **se editan** y se
  eliminan por borrado lógico (`deletedAt`). La regla de inmutabilidad del brief
  aplica solo a pagos.
- **Dinero:** en centavos (int), `amount > 0`.
- **UI:** pestañas Pagos | Gastos dentro de la sección Caja.

## Modelo de datos

### Entidad `Expense` (`src/domain/entities/expense.ts`)

Extiende `SyncableEntity`.

| Campo         | Tipo              | Notas                  |
| ------------- | ----------------- | ---------------------- |
| `businessId`  | `string`          | UUID                   |
| `category`    | `ExpenseCategory` | enum                   |
| `description` | `string \| null`  | max 500                |
| `amount`      | `number`          | centavos, entero > 0   |
| `spentAt`     | `string`          | ISO UTC, default ahora |

### Migración `0007_expenses`

- Tabla `expenses` con convenciones snake_case (`business_id`, `category`,
  `description`, `amount`, `spent_at`, + campos syncable).
- `CHECK (category IN ('supplies','rent','utilities','salaries','other'))`.
- `CHECK (amount > 0)`.
- FK a `businesses`. Índice `(business_id, spent_at) WHERE deleted_at IS NULL`.
- Sin triggers de relación (solo depende del negocio, igual que `employees`).
- Archivo `.down.sql`.

## Dominio

### `ExpenseRepository`

```
findActiveByBusiness(businessId: string): Promise<Expense[]>
create(expense: Expense): Promise<void>
update(expense: Expense): Promise<void>
delete(expense: Expense): Promise<void>   // marca deletedAt
```

### `expense.service.ts`

- `createExpense(values, businessId, deviceId, repository)`: valida, convierte a
  centavos, arma entidad (`version: 1`).
- `updateExpense(current, values, repository)`: aplica cambios, incrementa
  `version`.
- `deleteExpense(current, repository)`: marca `deletedAt`, incrementa `version`.

### `SqliteExpenseRepository`

Patrón de `SqlitePaymentRepository` con `expenseRowSchema` zod.

## Estado (store)

- `expenses: Expense[]`, cargado en `initialize()` (dentro del `Promise.all`).
- `addExpense`, `editExpense`, `deleteExpense` (mismos patrones que pagos/citas).

## Schema

`src/schemas/expense.schema.ts`: `category` (enum), `description` (trim max 500),
`amount` (> 0, max 1.000.000), `spentAt` (fecha válida). Con `.spec.ts`.

## UI

- `src/features/cash/cash-screen.tsx`: header "Caja" + switcher de pestañas
  Pagos | Gastos.
- `src/features/payments/payments-panel.tsx`: cuerpo de pagos (form + lista)
  extraído de la actual `payments-screen.tsx`, sin header propio.
- `src/features/expenses/expenses-panel.tsx`, `components/expense-form.tsx`
  (crear y editar), `components/expense-list.tsx` (con eliminar confirmado),
  `expense-presenter.ts` (etiquetas de categoría).
- `App.tsx`: `APP_SECTION.PAYMENTS` renderiza `CashScreen`.

## Testing (Vitest)

- `expense.service.spec.ts`: crea; edita incrementando versión; elimina marcando
  `deletedAt`.
- `expense.schema.spec.ts`: validaciones.
- Ampliar `sqlite-repositories.spec.ts` con `expenses` (create + update + delete).

## Fuera de alcance

Reportes diario/mensual, exportación e impresión. Entregas posteriores.

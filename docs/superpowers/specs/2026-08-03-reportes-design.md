# Diseño — Reportes (Fase 3, entrega 3)

Fecha: 2026-08-03
Estado: aprobado, pendiente de implementación

## Contexto

Tercera entrega de la Fase 3 (Finanzas) de Agendivo. Pagos y Gastos ya están
completos. Esta cubre **Reportes diario y mensual**. Exportación e impresión
quedan fuera de alcance.

## Decisiones de diseño

- **Contenido:** totales (ingresos, egresos, balance, # citas, # pagos) más
  desglose de ingresos por método de pago y egresos por categoría. El reporte
  mensual añade una tabla día por día.
- **Visualización:** tarjetas y tablas. Sin Recharts ni dependencias nuevas.
- **Fuente de datos:** funciones puras sobre los arrays ya cargados en el store
  (`payments`, `expenses`, `appointments`). No hay queries ni estado nuevo.
- **Zona horaria:** el agrupamiento por día/mes usa la timezone del negocio
  (`business.timezone`), respetando la regla del brief de mostrar fechas en la
  zona configurada.

## Dominio

### Helper `localDateKey` (`src/lib/local-date.ts`)

- `localDateKey(isoUtc: string, timeZone: string): string` → `"YYYY-MM-DD"` en la
  timezone dada, con `Intl.DateTimeFormat` (sin dependencias).
- `localMonthKey(isoUtc, timeZone): string` → `"YYYY-MM"`.

### `report.service.ts` (`src/domain/services/`)

```
interface FinanceSummary {
  incomeTotal: number;        // centavos
  expenseTotal: number;       // centavos
  balance: number;            // income - expense
  paymentCount: number;
  appointmentCount: number;   // citas iniciadas en el periodo, sin cancelled/no_show
  incomeByMethod: { method: PaymentMethod; total: number }[];
  expenseByCategory: { category: ExpenseCategory; total: number }[];
}

interface MonthlyReport extends FinanceSummary {
  days: { date: string; income: number; expense: number; balance: number }[];
}

interface ReportInput {
  payments: Payment[];
  expenses: Expense[];
  appointments: Appointment[];
  timeZone: string;
}
```

- `dailyReport(date: string, input: ReportInput): FinanceSummary` — filtra por
  `localDateKey === date` (pagos por `paidAt`, gastos por `spentAt`, citas por
  `startsAt`).
- `monthlyReport(yearMonth: string, input: ReportInput): MonthlyReport` — filtra
  por `localMonthKey === yearMonth`; `days` ordenado ascendente e incluye solo
  los días con movimiento.
- Desgloses: solo métodos/categorías con total > 0, ordenados por total desc.

## UI

`src/features/reports/`:

- `reports-screen.tsx`: conectado a `APP_SECTION.REPORTS`, header + pestañas
  **Diario | Mensual** (patrón de `cash-screen`).
- `daily-report-panel.tsx`: `<input type="date">` (default hoy) + tarjetas +
  desgloses.
- `monthly-report-panel.tsx`: `<input type="month">` (default mes actual) +
  tarjetas + tabla día por día.
- `components/summary-cards.tsx`: tarjetas de ingresos, egresos, balance,
  # citas, # pagos.
- `components/breakdown-list.tsx`: lista etiqueta → monto (reusa
  `paymentMethodLabel` y `expenseCategoryLabel`).

En `app-shell.tsx` se quita `upcoming: true` del ítem Reportes.

## Testing (Vitest)

- `report.service.spec.ts`: totales del día; filtrado por fecha local según
  timezone; agrupación de ingresos por método y egresos por categoría; desglose
  día por día del mensual; periodo sin movimientos (todo en cero).
- `local-date.spec.ts`: `localDateKey`/`localMonthKey` convierten UTC a la fecha
  local esperada en una timezone con offset negativo.

## Fuera de alcance

Exportación de reportes e impresión de comprobantes. Entregas posteriores.

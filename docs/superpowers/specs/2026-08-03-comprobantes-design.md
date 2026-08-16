# Diseño — Impresión de comprobantes (Fase 3, entrega 4)

Fecha: 2026-08-03
Estado: aprobado, pendiente de implementación

## Contexto

Cuarta y última entrega de la Fase 3 (Finanzas) de Agendivo. Pagos, gastos,
reportes y exportación ya están completos. Esta cubre la **impresión de
comprobantes**, entendidos como **recibos de pago**.

## Decisiones de diseño

- **Comprobante = recibo de pago:** se imprime uno por cada pago registrado.
- **Método:** `window.print()` sobre una plantilla HTML estilizada con
  `@media print`. Sin dependencias ni plugins nuevos; usa el diálogo de
  impresión del sistema (WebView2 lo soporta). Ideal offline.

## Contenido del recibo

- Nombre del negocio y "Recibo de pago".
- Fecha del pago (`paidAt`) en la zona horaria del negocio.
- Cliente.
- Cita asociada (fecha/hora) si `appointmentId` no es null.
- Monto (`formatMoney`) y método (`paymentMethodLabel`).
- Notas si existen.
- Identificador corto del pago (primeros caracteres del UUID) como folio.

## Implementación

- `src/features/payments/components/payment-receipt.tsx`: componente
  presentacional que recibe `payment`, `business`, `customer` y `appointment`
  y renderiza el recibo dentro de un contenedor `.receipt-print`.
- CSS global en `src/index.css`: bloque `@media print` que oculta la app
  (`body * { visibility: hidden }`) y muestra solo `.receipt-print`.
- Estado y disparo en `payments-panel.tsx`: `receiptPayment` se setea al pulsar
  **Imprimir** en la lista; un `useEffect` llama a `window.print()` cuando el
  recibo está montado y limpia el estado en `onafterprint`.
- `payment-list.tsx`: nuevo botón **Imprimir** por pago (junto a Anular).
- `payments-panel` selecciona `appointments` para resolver la cita del recibo.

## Testing

No hay lógica de dominio nueva: el recibo es una plantilla presentacional y el
disparo es una API del navegador. Consistente con el repo, que no testea
componentes presentacionales. Los helpers de formato (`formatMoney`,
`paymentMethodLabel`) ya están cubiertos.

## Fuera de alcance

Con esta entrega se completa la Fase 3. Quedan para fases posteriores: backups y
restauración (Fase 4) y distribución (Fase 5).

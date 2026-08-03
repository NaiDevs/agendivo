import { format } from "date-fns";

import type { Appointment } from "@/domain/entities/appointment";
import type { Business } from "@/domain/entities/business";
import type { Customer } from "@/domain/entities/customer";
import type { Payment } from "@/domain/entities/payment";
import { paymentMethodLabel } from "@/features/payments/payment-presenter";
import { formatMoney } from "@/lib/format-money";

interface PaymentReceiptProps {
  payment: Payment;
  business: Business;
  customer: Customer | null;
  appointment: Appointment | null;
}

export function PaymentReceipt({
  payment,
  business,
  customer,
  appointment,
}: PaymentReceiptProps) {
  return (
    <div className="receipt-print">
      <div className="receipt-sheet">
        <header className="receipt-header">
          <p className="receipt-business">{business.name}</p>
          <p className="receipt-title">Recibo de pago</p>
          <p className="receipt-folio">Folio {payment.id.slice(0, 8)}</p>
        </header>

        <dl className="receipt-body">
          <Row label="Fecha">
            {format(new Date(payment.paidAt), "dd/MM/yyyy HH:mm")}
          </Row>
          <Row label="Cliente">{customer?.name ?? "—"}</Row>
          {appointment !== null && (
            <Row label="Cita">
              {format(new Date(appointment.startsAt), "dd/MM/yyyy HH:mm")}
            </Row>
          )}
          <Row label="Método">{paymentMethodLabel[payment.method]}</Row>
          {payment.notes !== null && <Row label="Notas">{payment.notes}</Row>}
        </dl>

        <div className="receipt-total">
          <span>Total</span>
          <span>{formatMoney(payment.amount, business.currency)}</span>
        </div>

        <p className="receipt-footer">Gracias por su preferencia.</p>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="receipt-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

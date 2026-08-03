import { format } from "date-fns";
import { CircleDollarSign, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Customer } from "@/domain/entities/customer";
import type { Payment } from "@/domain/entities/payment";
import { paymentMethodLabel } from "@/features/payments/payment-presenter";
import { formatMoney } from "@/lib/format-money";

interface PaymentListProps {
  payments: Payment[];
  customers: Customer[];
  currency: string;
  isSaving: boolean;
  onVoid: (paymentId: string) => void;
}

export function PaymentList({
  payments,
  customers,
  currency,
  isSaving,
  onVoid,
}: PaymentListProps) {
  return (
    <div className="surface-card min-h-80 p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Movimientos</h2>
          <p className="text-muted-foreground text-sm">
            {payments.length} pagos registrados
          </p>
        </div>
      </div>
      {payments.length === 0 ? (
        <div className="empty-state">
          <CircleDollarSign className="text-primary size-7" />
          <p className="text-foreground font-medium">Aún no hay pagos</p>
          <p className="text-muted-foreground max-w-xs text-sm">
            Registra el primero con el formulario.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {payments.map((payment) => {
            const customer = customers.find(
              (item) => item.id === payment.customerId,
            );
            return (
              <article
                className="flex items-center justify-between gap-3 rounded-2xl border bg-white p-4 transition hover:shadow-md"
                key={payment.id}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {customer?.name ?? "Cliente"}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {format(new Date(payment.paidAt), "dd/MM/yyyy HH:mm")} ·{" "}
                    {paymentMethodLabel[payment.method]}
                    {payment.appointmentId !== null && " · cita"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-primary text-base font-bold">
                    {formatMoney(payment.amount, currency)}
                  </span>
                  <Button
                    aria-label="Anular pago"
                    disabled={isSaving}
                    onClick={() => onVoid(payment.id)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

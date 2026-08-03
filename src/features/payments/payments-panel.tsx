import { CircleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import type { Payment } from "@/domain/entities/payment";
import { PaymentForm } from "@/features/payments/components/payment-form";
import { PaymentList } from "@/features/payments/components/payment-list";
import { PaymentReceipt } from "@/features/payments/components/payment-receipt";
import { useAppStore } from "@/stores/app.store";

export function PaymentsPanel() {
  const business = useAppStore((state) => state.business);
  const customers = useAppStore((state) => state.customers);
  const appointments = useAppStore((state) => state.appointments);
  const payments = useAppStore((state) => state.payments);
  const isSaving = useAppStore((state) => state.isSaving);
  const voidPayment = useAppStore((state) => state.voidPayment);
  const currency = business?.currency ?? "GTQ";
  const readyToCharge = customers.length > 0;
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  useEffect(() => {
    if (receiptPayment === null) {
      return;
    }
    const clear = (): void => setReceiptPayment(null);
    window.addEventListener("afterprint", clear, { once: true });
    const frame = requestAnimationFrame(() => window.print());
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("afterprint", clear);
    };
  }, [receiptPayment]);

  const onVoid = (paymentId: string): void => {
    if (
      window.confirm(
        "¿Anular este pago? Quedará registrado como anulado y no se podrá deshacer.",
      )
    ) {
      void voidPayment(paymentId);
    }
  };

  return (
    <div className="grid gap-6">
      {!readyToCharge && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-amber-950">
          <CircleAlert className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">Registra un cliente antes de cobrar</p>
            <p className="mt-1 text-sm text-amber-900/75">
              Todo pago necesita un cliente asociado.
            </p>
          </div>
        </div>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(300px,0.72fr)_1.28fr]">
        {readyToCharge && <PaymentForm />}
        <PaymentList
          currency={currency}
          customers={customers}
          isSaving={isSaving}
          onPrint={setReceiptPayment}
          onVoid={onVoid}
          payments={payments}
        />
      </div>
      {receiptPayment !== null && business !== null && (
        <PaymentReceipt
          appointment={
            appointments.find(
              (item) => item.id === receiptPayment.appointmentId,
            ) ?? null
          }
          business={business}
          customer={
            customers.find((item) => item.id === receiptPayment.customerId) ??
            null
          }
          payment={receiptPayment}
        />
      )}
    </div>
  );
}

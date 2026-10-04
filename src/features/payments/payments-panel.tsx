import { CircleAlert } from "lucide-react";
import { useState } from "react";

import type { Payment } from "@/domain/entities/payment";
import { PaymentForm } from "@/features/payments/components/payment-form";
import { PaymentList } from "@/features/payments/components/payment-list";
import { PaymentReceipt } from "@/features/payments/components/payment-receipt";
import { buildPaymentReceiptData } from "@/features/payments/payment-receipt-data";
import { useAppStore } from "@/stores/app.store";

export function PaymentsPanel() {
  const business = useAppStore((state) => state.business);
  const customers = useAppStore((state) => state.customers);
  const appointments = useAppStore((state) => state.appointments);
  const employees = useAppStore((state) => state.employees);
  const services = useAppStore((state) => state.services);
  const payments = useAppStore((state) => state.payments);
  const isSaving = useAppStore((state) => state.isSaving);
  const voidPayment = useAppStore((state) => state.voidPayment);
  const currency = business?.currency ?? "GTQ";
  const readyToCharge = customers.length > 0;
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  const receiptAppointment =
    appointments.find((item) => item.id === receiptPayment?.appointmentId) ??
    null;
  const receiptData =
    receiptPayment === null || business === null
      ? null
      : buildPaymentReceiptData({
          appointment: receiptAppointment,
          business,
          customer:
            customers.find((item) => item.id === receiptPayment.customerId) ??
            null,
          employee:
            employees.find(
              (item) => item.id === receiptAppointment?.employeeId,
            ) ?? null,
          payment: receiptPayment,
          payments,
          service:
            services.find(
              (item) => item.id === receiptAppointment?.serviceId,
            ) ?? null,
        });

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
        {readyToCharge && <PaymentForm onPaymentSaved={setReceiptPayment} />}
        <PaymentList
          currency={currency}
          customers={customers}
          isSaving={isSaving}
          onPrint={setReceiptPayment}
          onVoid={onVoid}
          payments={payments}
        />
      </div>
      {receiptData !== null && (
        <PaymentReceipt
          data={receiptData}
          onClose={() => setReceiptPayment(null)}
          onPrint={() => window.print()}
        />
      )}
    </div>
  );
}

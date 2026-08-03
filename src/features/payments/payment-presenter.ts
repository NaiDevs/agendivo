import { PAYMENT_METHOD, type PaymentMethod } from "@/domain/entities/payment";

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  [PAYMENT_METHOD.CASH]: "Efectivo",
  [PAYMENT_METHOD.CARD]: "Tarjeta",
  [PAYMENT_METHOD.TRANSFER]: "Transferencia",
  [PAYMENT_METHOD.OTHER]: "Otro",
};

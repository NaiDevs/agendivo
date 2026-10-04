import type { Appointment } from "@/domain/entities/appointment";
import type { Business } from "@/domain/entities/business";
import type { Customer } from "@/domain/entities/customer";
import type { Employee } from "@/domain/entities/employee";
import type { Payment } from "@/domain/entities/payment";
import type { FiscalInvoiceSnapshot } from "@/domain/entities/payment";
import type { Service } from "@/domain/entities/service";
import { paymentMethodLabel } from "@/features/payments/payment-presenter";

export interface PaymentReceiptData {
  appointment: {
    employeeName: string;
  } | null;
  balanceAfterPayment: number | null;
  business: {
    address: string | null;
    email: string | null;
    name: string;
    phone: string | null;
  };
  currency: string;
  documentTitle: string;
  customer: {
    name: string;
    phone: string | null;
  };
  folio: string;
  fiscalInvoice: FiscalInvoiceSnapshot | null;
  issuedAt: string;
  method: string;
  paidAmount: number;
  serviceItems: Array<{ name: string; price: number }>;
  serviceAmount: number;
}

interface BuildPaymentReceiptDataInput {
  appointment: Appointment | null;
  business: Business;
  customer: Customer | null;
  employee: Employee | null;
  payment: Payment;
  payments: Payment[];
  service: Service | null;
}

export function buildPaymentReceiptData({
  appointment,
  business,
  customer,
  employee,
  payment,
  payments,
  service,
}: BuildPaymentReceiptDataInput): PaymentReceiptData {
  const paidForAppointment =
    appointment === null
      ? null
      : payments
          .filter((item) => item.appointmentId === appointment.id)
          .reduce((total, item) => total + item.amount, 0);

  return {
    appointment:
      appointment === null
        ? null
        : {
            employeeName: employee?.name ?? "Sin profesional asignado",
          },
    balanceAfterPayment:
      appointment === null || paidForAppointment === null
        ? null
        : Math.max(0, appointment.price - paidForAppointment),
    business: {
      address: business.address,
      email: business.email,
      name: business.name,
      phone: business.phone,
    },
    currency: business.currency,
    customer: {
      name: customer?.name ?? "Cliente",
      phone: customer?.phone ?? null,
    },
    documentTitle:
      payment.fiscalInvoice === null ? "Recibo de pago" : "Factura fiscal",
    folio:
      payment.fiscalInvoice?.number ??
      `REC-${payment.id.replace(/-/g, "").slice(0, 10).toUpperCase()}`,
    fiscalInvoice: payment.fiscalInvoice,
    issuedAt: payment.paidAt,
    method: paymentMethodLabel[payment.method],
    paidAmount: payment.amount,
    serviceItems:
      payment.serviceItems.length > 0
        ? payment.serviceItems.map((item) => ({
            name: item.name,
            price: item.price,
          }))
        : appointment?.serviceItems.length
          ? appointment.serviceItems.map((item) => ({
              name: item.name,
              price: item.price,
            }))
          : [
              {
                name: service?.name ?? "Pago de servicio",
                price: appointment?.price ?? payment.amount,
              },
            ],
    serviceAmount: appointment?.price ?? payment.amount,
  };
}

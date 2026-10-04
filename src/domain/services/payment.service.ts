import type { FiscalConfiguration } from "@/domain/entities/fiscal-configuration";
import type { Appointment } from "@/domain/entities/appointment";
import type { Service } from "@/domain/entities/service";
import type { ServiceLineItem } from "@/domain/entities/service-line-item";
import {
  PAYMENT_DOCUMENT_TYPE,
  type FiscalInvoiceSnapshot,
  type Payment,
} from "@/domain/entities/payment";
import { PaymentExceedsBalanceError } from "@/domain/errors/payment-exceeds-balance.error";
import type { PaymentRepository } from "@/domain/repositories/payment.repository";
import {
  paymentFormSchema,
  type PaymentFormValues,
} from "@/schemas/payment.schema";

export function pendingBalance(
  appointmentPriceInCents: number,
  activePayments: Payment[],
): number {
  const paid = activePayments.reduce((sum, payment) => sum + payment.amount, 0);
  return appointmentPriceInCents - paid;
}

export async function createPayment(
  values: PaymentFormValues,
  businessId: string,
  deviceId: string,
  repository: PaymentRepository,
  remainingBalanceInCents?: number | null,
  fiscalConfiguration?: FiscalConfiguration | null,
  services: Service[] = [],
  appointment: Appointment | null = null,
): Promise<Payment> {
  const input = paymentFormSchema.parse(values);
  const amount = Math.round(input.amount * 100);
  const appointmentId = input.appointmentId === "" ? null : input.appointmentId;

  if (
    appointmentId !== null &&
    typeof remainingBalanceInCents === "number" &&
    amount > remainingBalanceInCents
  ) {
    throw new PaymentExceedsBalanceError();
  }

  const now = new Date().toISOString();
  const paidAt = new Date(input.paidAt).toISOString();
  const fiscalInvoice = createFiscalInvoiceSnapshot(
    fiscalConfiguration,
    input.paidAt.slice(0, 10),
  );
  const serviceItems =
    appointment?.serviceItems ??
    buildPaymentServiceItems(input.serviceIds, services);
  const payment: Payment = {
    id: crypto.randomUUID(),
    businessId,
    appointmentId,
    customerId: input.customerId,
    amount,
    method: input.method,
    paidAt,
    notes: input.notes === "" ? null : input.notes,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    deviceId,
    documentType:
      fiscalInvoice === null
        ? PAYMENT_DOCUMENT_TYPE.RECEIPT
        : PAYMENT_DOCUMENT_TYPE.FISCAL_INVOICE,
    fiscalInvoice,
    serviceItems,
  };

  await repository.create(payment);
  return payment;
}

function buildPaymentServiceItems(
  serviceIds: string[],
  services: Service[],
): ServiceLineItem[] {
  return serviceIds.map((serviceId) => {
    const service = services.find((item) => item.id === serviceId);
    if (service === undefined) {
      throw new Error(
        "Uno de los servicios seleccionados ya no está disponible.",
      );
    }
    return {
      serviceId: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: service.price,
    };
  });
}

export function reflectIssuedFiscalInvoice(
  configuration: FiscalConfiguration,
  payment: Payment,
): FiscalConfiguration {
  const snapshot = payment.fiscalInvoice;
  const authorization = configuration.authorization;
  if (snapshot === null || authorization === null) return configuration;
  if (snapshot.authorizationId !== authorization.id) {
    throw new Error("La factura no pertenece a la autorización fiscal activa.");
  }

  return {
    ...configuration,
    authorization: {
      ...authorization,
      active: snapshot.correlative < authorization.rangeEnd,
      nextNumber:
        snapshot.correlative === authorization.rangeEnd
          ? authorization.rangeEnd
          : snapshot.correlative + 1,
      updatedAt: payment.updatedAt,
      version: authorization.version + 1,
      deviceId: payment.deviceId,
    },
  };
}

export async function issueFiscalInvoice(
  current: Payment,
  configuration: FiscalConfiguration,
  deviceId: string,
  repository: PaymentRepository,
  issuedDate: string = localIsoDate(new Date()),
): Promise<Payment> {
  if (current.deletedAt !== null) {
    throw new Error("No se puede facturar un pago anulado.");
  }
  if (current.fiscalInvoice !== null) return current;

  const fiscalInvoice = createFiscalInvoiceSnapshot(configuration, issuedDate);
  if (fiscalInvoice === null) {
    throw new Error("Activa la facturación fiscal antes de emitir la factura.");
  }

  const issued: Payment = {
    ...current,
    documentType: PAYMENT_DOCUMENT_TYPE.FISCAL_INVOICE,
    fiscalInvoice,
    updatedAt: new Date().toISOString(),
    version: current.version + 1,
    deviceId,
  };
  await repository.issueFiscalInvoice(issued);
  return issued;
}

function createFiscalInvoiceSnapshot(
  configuration: FiscalConfiguration | null | undefined,
  issuedDate: string,
): FiscalInvoiceSnapshot | null {
  if (configuration?.profile.invoicesEnabled !== true) return null;
  const point = configuration.emissionPoint;
  const authorization = configuration.authorization;
  if (point === null || authorization === null || !authorization.active) {
    throw new Error(
      "Configura un correlativo fiscal activo antes de emitir facturas.",
    );
  }
  if (
    authorization.nextNumber < authorization.rangeStart ||
    authorization.nextNumber > authorization.rangeEnd
  ) {
    throw new Error("El correlativo fiscal está fuera del rango autorizado.");
  }
  if (authorization.validUntil < issuedDate) {
    throw new Error("La autorización fiscal está vencida.");
  }
  if (configuration.profile.taxId === null) {
    throw new Error("Configura el RTN antes de emitir facturas fiscales.");
  }

  const correlative = authorization.nextNumber;
  return {
    authorizationId: authorization.id,
    cai: authorization.cai,
    correlative,
    emissionPointCode: point.emissionPointCode,
    establishmentCode: point.establishmentCode,
    issuedDate,
    legalName: configuration.profile.legalName,
    number: `${point.establishmentCode}-${point.emissionPointCode}-01-${String(correlative).padStart(8, "0")}`,
    rangeEnd: authorization.rangeEnd,
    rangeStart: authorization.rangeStart,
    taxId: configuration.profile.taxId,
    validUntil: authorization.validUntil,
  };
}

function localIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function voidPayment(
  current: Payment,
  repository: PaymentRepository,
): Promise<Payment> {
  const now = new Date().toISOString();
  const payment: Payment = {
    ...current,
    deletedAt: now,
    updatedAt: now,
    version: current.version + 1,
  };
  await repository.void(payment);
  return payment;
}

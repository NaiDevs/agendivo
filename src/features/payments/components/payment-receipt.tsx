import { format } from "date-fns";
import { Printer, ReceiptText, X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { PaymentReceiptData } from "@/features/payments/payment-receipt-data";
import { formatMoney } from "@/lib/format-money";

interface PaymentReceiptProps {
  data: PaymentReceiptData;
  onClose: () => void;
  onPrint: () => void;
}

export function PaymentReceipt({
  data,
  onClose,
  onPrint,
}: PaymentReceiptProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return (): void => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      aria-label={`Vista previa de ${data.documentTitle.toLowerCase()}`}
      aria-modal="true"
      className="receipt-overlay"
      role="dialog"
    >
      <div className="receipt-preview">
        <div className="receipt-preview-toolbar">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-semibold">
              <ReceiptText className="text-primary size-4" />
              Documento listo
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {data.folio}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onClose} type="button" variant="outline">
              <X />
              Cerrar
            </Button>
            <Button onClick={onPrint} type="button">
              <Printer />
              Imprimir
            </Button>
          </div>
        </div>

        <article className="receipt-sheet">
          <header className="receipt-header">
            <p className="receipt-business">{data.business.name}</p>
            {data.business.address !== null && (
              <p className="receipt-contact">{data.business.address}</p>
            )}
            {data.business.phone !== null && (
              <p className="receipt-contact">Tel. {data.business.phone}</p>
            )}
            {data.business.email !== null && (
              <p className="receipt-contact">{data.business.email}</p>
            )}
            <div className="receipt-document-heading">
              <p className="receipt-title">{data.documentTitle}</p>
              <p className="receipt-folio">{data.folio}</p>
            </div>
          </header>

          {data.fiscalInvoice !== null && (
            <section className="receipt-section receipt-fiscal-section">
              <p className="receipt-section-label">Datos fiscales</p>
              <ReceiptRow label="Factura No.">
                {data.fiscalInvoice.number}
              </ReceiptRow>
              <ReceiptRow label="Fecha de emisión">
                {format(
                  new Date(`${data.fiscalInvoice.issuedDate}T00:00:00`),
                  "dd/MM/yyyy",
                )}
              </ReceiptRow>
              <ReceiptRow label="Razón social">
                {data.fiscalInvoice.legalName}
              </ReceiptRow>
              <ReceiptRow label="RTN">{data.fiscalInvoice.taxId}</ReceiptRow>
              <ReceiptRow label="CAI">{data.fiscalInvoice.cai}</ReceiptRow>
              <ReceiptRow label="Rango autorizado">
                {formatFiscalNumber(
                  data.fiscalInvoice.establishmentCode,
                  data.fiscalInvoice.emissionPointCode,
                  data.fiscalInvoice.rangeStart,
                )}
                {" al "}
                {formatFiscalNumber(
                  data.fiscalInvoice.establishmentCode,
                  data.fiscalInvoice.emissionPointCode,
                  data.fiscalInvoice.rangeEnd,
                )}
              </ReceiptRow>
              <ReceiptRow label="Fecha límite">
                {format(
                  new Date(`${data.fiscalInvoice.validUntil}T00:00:00`),
                  "dd/MM/yyyy",
                )}
              </ReceiptRow>
            </section>
          )}

          <section className="receipt-section">
            <ReceiptRow label="Fecha">
              {format(new Date(data.issuedAt), "dd/MM/yyyy HH:mm")}
            </ReceiptRow>
            <ReceiptRow label="Cliente">{data.customer.name}</ReceiptRow>
            {data.customer.phone !== null && (
              <ReceiptRow label="Teléfono">{data.customer.phone}</ReceiptRow>
            )}
            {data.appointment !== null && (
              <ReceiptRow label="Quién lo atendió">
                {data.appointment.employeeName}
              </ReceiptRow>
            )}
          </section>

          <section className="receipt-concept">
            <p className="receipt-section-label">Detalle del servicio</p>
            {data.serviceItems.map((item, index) => (
              <div
                className="receipt-concept-line"
                key={`${item.name}-${index}`}
              >
                <p className="receipt-concept-name">{item.name}</p>
                <strong>{formatMoney(item.price, data.currency)}</strong>
              </div>
            ))}
          </section>

          <section className="receipt-payment">
            <ReceiptRow label="Forma de pago">{data.method}</ReceiptRow>
            <div className="receipt-total">
              <span>Monto recibido</span>
              <span>{formatMoney(data.paidAmount, data.currency)}</span>
            </div>
            {data.balanceAfterPayment !== null &&
              data.balanceAfterPayment > 0 && (
                <ReceiptRow label="Saldo pendiente">
                  {formatMoney(data.balanceAfterPayment, data.currency)}
                </ReceiptRow>
              )}
          </section>

          <footer className="receipt-footer">
            {data.fiscalInvoice === null ? (
              <>
                <p>¡Gracias por su preferencia!</p>
                <p>Conserve este documento como comprobante de pago.</p>
              </>
            ) : (
              <>
                <p>Original: Cliente</p>
                <p>Copia: Obligado tributario emisor</p>
                <p>La factura es beneficio de todos, ¡exíjala!</p>
              </>
            )}
          </footer>
        </article>
      </div>
    </div>
  );
}

function formatFiscalNumber(
  establishmentCode: string,
  emissionPointCode: string,
  correlative: number,
): string {
  return `${establishmentCode}-${emissionPointCode}-01-${String(correlative).padStart(8, "0")}`;
}

function ReceiptRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="receipt-row">
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}

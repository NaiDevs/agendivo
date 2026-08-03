export class PaymentExceedsBalanceError extends Error {
  constructor() {
    super("El monto supera el saldo pendiente de la cita.");
    this.name = "PaymentExceedsBalanceError";
  }
}

import type { Payment } from "@/domain/entities/payment";

export interface PaymentRepository {
  findActiveByBusiness(businessId: string): Promise<Payment[]>;
  findByAppointment(appointmentId: string): Promise<Payment[]>;
  create(payment: Payment): Promise<void>;
  void(payment: Payment): Promise<void>;
}

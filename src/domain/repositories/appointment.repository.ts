import type { Appointment } from "@/domain/entities/appointment";

export interface AppointmentRepository {
  findActiveByBusiness(businessId: string): Promise<Appointment[]>;
  hasOverlap(
    employeeId: string,
    startsAt: string,
    endsAt: string,
    excludedAppointmentId?: string,
  ): Promise<boolean>;
  create(appointment: Appointment): Promise<void>;
  update(appointment: Appointment): Promise<void>;
}

import { describe, expect, it } from "vitest";

import {
  APPOINTMENT_STATUS,
  type Appointment,
} from "@/domain/entities/appointment";
import type { Service } from "@/domain/entities/service";
import { AppointmentConflictError } from "@/domain/errors/appointment-conflict.error";
import type { AppointmentRepository } from "@/domain/repositories/appointment.repository";
import { createAppointment } from "@/domain/services/appointment.service";

class FakeAppointmentRepository implements AppointmentRepository {
  created: Appointment | null = null;
  overlap = false;

  async findActiveByBusiness(): Promise<Appointment[]> {
    return [];
  }
  async hasOverlap(): Promise<boolean> {
    return this.overlap;
  }
  async create(appointment: Appointment): Promise<void> {
    this.created = appointment;
  }
  async update(): Promise<void> {}
}

const service: Service = {
  id: "33333333-3333-4333-8333-333333333333",
  businessId: "44444444-4444-4444-8444-444444444444",
  name: "Corte clásico",
  description: null,
  durationMinutes: 45,
  price: 7500,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  deletedAt: null,
  version: 1,
  deviceId: "55555555-5555-4555-8555-555555555555",
};

const values = {
  customerId: "11111111-1111-4111-8111-111111111111",
  employeeId: "22222222-2222-4222-8222-222222222222",
  serviceId: service.id,
  startsAt: "2026-08-04T10:30",
  status: APPOINTMENT_STATUS.PENDING,
  durationMinutes: 45,
  price: 75,
  notes: "Primera visita",
};

describe("createAppointment", () => {
  it("calcula el fin, conserva el precio y guarda fechas UTC", async () => {
    const repository = new FakeAppointmentRepository();
    const appointment = await createAppointment(
      values,
      service.businessId,
      service.deviceId,
      repository,
    );

    expect(
      new Date(appointment.endsAt).getTime() -
        new Date(appointment.startsAt).getTime(),
    ).toBe(45 * 60 * 1000);
    expect(appointment.startsAt.endsWith("Z")).toBe(true);
    expect(appointment.price).toBe(7500);
    expect(repository.created).toEqual(appointment);
  });

  it("bloquea un horario superpuesto", async () => {
    const repository = new FakeAppointmentRepository();
    repository.overlap = true;

    await expect(
      createAppointment(
        values,
        service.businessId,
        service.deviceId,
        repository,
      ),
    ).rejects.toBeInstanceOf(AppointmentConflictError);
  });

  it("permite una cita sin profesional ni servicio", async () => {
    const repository = new FakeAppointmentRepository();
    repository.overlap = true;

    const appointment = await createAppointment(
      { ...values, employeeId: "", serviceId: "" },
      service.businessId,
      service.deviceId,
      repository,
    );

    expect(appointment.employeeId).toBeNull();
    expect(appointment.serviceId).toBeNull();
  });
});

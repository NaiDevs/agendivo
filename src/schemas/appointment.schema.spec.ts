import { describe, expect, it } from "vitest";

import { APPOINTMENT_STATUS } from "@/domain/entities/appointment";
import { appointmentFormSchema } from "@/schemas/appointment.schema";

const validAppointment = {
  customerId: "11111111-1111-4111-8111-111111111111",
  employeeId: "22222222-2222-4222-8222-222222222222",
  serviceIds: ["33333333-3333-4333-8333-333333333333"],
  startsAt: "2026-08-04T10:30",
  status: APPOINTMENT_STATUS.PENDING,
  durationMinutes: 30,
  price: 75,
  notes: "",
};

describe("appointmentFormSchema", () => {
  it("acepta una cita completa", () => {
    expect(appointmentFormSchema.safeParse(validAppointment).success).toBe(
      true,
    );
  });

  it("rechaza identificadores inválidos", () => {
    expect(
      appointmentFormSchema.safeParse({ ...validAppointment, customerId: "" })
        .success,
    ).toBe(false);
  });

  it("rechaza una fecha inválida", () => {
    expect(
      appointmentFormSchema.safeParse({
        ...validAppointment,
        startsAt: "fecha",
      }).success,
    ).toBe(false);
  });

  it("acepta profesional vacío", () => {
    const result = appointmentFormSchema.safeParse({
      ...validAppointment,
      employeeId: "",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza una cita sin servicios", () => {
    expect(
      appointmentFormSchema.safeParse({ ...validAppointment, serviceIds: [] })
        .success,
    ).toBe(false);
  });
});

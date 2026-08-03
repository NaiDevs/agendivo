import { addMinutes } from "date-fns";

import {
  APPOINTMENT_STATUS,
  type Appointment,
} from "@/domain/entities/appointment";
import { AppointmentConflictError } from "@/domain/errors/appointment-conflict.error";
import type { AppointmentRepository } from "@/domain/repositories/appointment.repository";
import {
  appointmentFormSchema,
  type AppointmentFormValues,
} from "@/schemas/appointment.schema";

function getSchedule(values: AppointmentFormValues) {
  const startsAt = new Date(values.startsAt);
  const endsAt = addMinutes(startsAt, values.durationMinutes);
  return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
}

async function ensureAvailability(
  values: AppointmentFormValues,
  repository: AppointmentRepository,
  excludedAppointmentId?: string,
): Promise<{ startsAt: string; endsAt: string }> {
  const schedule = getSchedule(values);
  if (
    values.employeeId !== "" &&
    values.status !== APPOINTMENT_STATUS.CANCELLED &&
    values.status !== APPOINTMENT_STATUS.NO_SHOW &&
    (await repository.hasOverlap(
      values.employeeId,
      schedule.startsAt,
      schedule.endsAt,
      excludedAppointmentId,
    ))
  ) {
    throw new AppointmentConflictError();
  }
  return schedule;
}

export async function createAppointment(
  values: AppointmentFormValues,
  businessId: string,
  deviceId: string,
  repository: AppointmentRepository,
): Promise<Appointment> {
  const input = appointmentFormSchema.parse(values);
  const schedule = await ensureAvailability(input, repository);
  const now = new Date().toISOString();
  const appointment: Appointment = {
    id: crypto.randomUUID(),
    businessId,
    customerId: input.customerId,
    employeeId: input.employeeId === "" ? null : input.employeeId,
    serviceId: input.serviceId === "" ? null : input.serviceId,
    startsAt: schedule.startsAt,
    endsAt: schedule.endsAt,
    status: input.status,
    price: Math.round(input.price * 100),
    notes: input.notes === "" ? null : input.notes,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    deviceId,
  };

  await repository.create(appointment);
  return appointment;
}

export async function updateAppointment(
  current: Appointment,
  values: AppointmentFormValues,
  repository: AppointmentRepository,
): Promise<Appointment> {
  const input = appointmentFormSchema.parse(values);
  const schedule = await ensureAvailability(input, repository, current.id);
  const appointment: Appointment = {
    ...current,
    customerId: input.customerId,
    employeeId: input.employeeId === "" ? null : input.employeeId,
    serviceId: input.serviceId === "" ? null : input.serviceId,
    startsAt: schedule.startsAt,
    endsAt: schedule.endsAt,
    status: input.status,
    price: Math.round(input.price * 100),
    notes: input.notes === "" ? null : input.notes,
    updatedAt: new Date().toISOString(),
    version: current.version + 1,
  };

  await repository.update(appointment);
  return appointment;
}

export async function cancelAppointment(
  current: Appointment,
  repository: AppointmentRepository,
): Promise<Appointment> {
  const appointment: Appointment = {
    ...current,
    status: APPOINTMENT_STATUS.CANCELLED,
    updatedAt: new Date().toISOString(),
    version: current.version + 1,
  };
  await repository.update(appointment);
  return appointment;
}

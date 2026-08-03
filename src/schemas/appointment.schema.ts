import { z } from "zod";

import { APPOINTMENT_STATUS } from "@/domain/entities/appointment";

export const appointmentFormSchema = z.object({
  customerId: z.string().uuid("Selecciona un cliente."),
  employeeId: z.union([
    z.literal(""),
    z.string().uuid("Selecciona un profesional válido."),
  ]),
  serviceId: z.union([
    z.literal(""),
    z.string().uuid("Selecciona un servicio válido."),
  ]),
  startsAt: z
    .string()
    .min(1, "Selecciona fecha y hora.")
    .refine(
      (value) => !Number.isNaN(new Date(value).getTime()),
      "Selecciona una fecha válida.",
    ),
  status: z.enum([
    APPOINTMENT_STATUS.PENDING,
    APPOINTMENT_STATUS.CONFIRMED,
    APPOINTMENT_STATUS.COMPLETED,
    APPOINTMENT_STATUS.CANCELLED,
    APPOINTMENT_STATUS.NO_SHOW,
  ]),
  durationMinutes: z
    .number()
    .int()
    .min(5, "La duración mínima es de 5 minutos.")
    .max(720),
  price: z.number().min(0, "El precio no puede ser negativo.").max(1_000_000),
  notes: z.string().trim().max(500),
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

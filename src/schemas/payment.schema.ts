import { z } from "zod";

import { PAYMENT_METHOD } from "@/domain/entities/payment";

export const paymentFormSchema = z.object({
  customerId: z.string().uuid("Selecciona un cliente."),
  appointmentId: z.union([
    z.literal(""),
    z.string().uuid("Selecciona una cita válida."),
  ]),
  serviceIds: z.array(z.string().uuid("Selecciona servicios válidos.")),
  amount: z
    .number()
    .positive("El monto debe ser mayor que cero.")
    .max(1_000_000),
  method: z.enum([
    PAYMENT_METHOD.CASH,
    PAYMENT_METHOD.CARD,
    PAYMENT_METHOD.TRANSFER,
    PAYMENT_METHOD.OTHER,
  ]),
  paidAt: z
    .string()
    .min(1, "Selecciona fecha y hora.")
    .refine(
      (value) => !Number.isNaN(new Date(value).getTime()),
      "Selecciona una fecha válida.",
    ),
  notes: z.string().trim().max(500),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

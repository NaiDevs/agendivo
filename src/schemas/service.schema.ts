import { z } from "zod";

export const serviceFormSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre del servicio.").max(120),
  description: z.string().trim().max(500),
  durationMinutes: z
    .number({ error: "Ingresa una duración válida." })
    .int("La duración debe expresarse en minutos.")
    .min(5, "La duración mínima es de 5 minutos.")
    .max(720, "La duración máxima es de 12 horas."),
  price: z
    .number({ error: "Ingresa un precio válido." })
    .min(0, "El precio no puede ser negativo.")
    .max(1_000_000, "El precio es demasiado alto."),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

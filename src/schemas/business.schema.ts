import { z } from "zod";

export const businessFormSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre del negocio.").max(120),
  phone: z.string().trim().max(30),
  email: z
    .string()
    .trim()
    .max(160)
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Ingresa un correo válido.",
    ),
  address: z.string().trim().max(240),
  timezone: z.string().trim().min(1, "Selecciona una zona horaria."),
  currency: z
    .string()
    .trim()
    .length(3, "La moneda debe usar un código de tres letras.")
    .transform((value) => value.toUpperCase()),
});

export type BusinessFormValues = z.input<typeof businessFormSchema>;

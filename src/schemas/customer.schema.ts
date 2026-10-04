import { z } from "zod";

export const customerCustomFieldValueSchema = z.union([
  z.boolean(),
  z.number().finite(),
  z.string(),
  z.array(z.string()),
  z.null(),
]);

export const customerFormSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre del cliente.").max(120),
  phone: z.string().trim().max(30),
  email: z
    .string()
    .trim()
    .max(160)
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Ingresa un correo válido.",
    ),
  notes: z.string().trim().max(500),
  customFieldValues: z.record(
    z.string().uuid(),
    customerCustomFieldValueSchema,
  ),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

import { z } from "zod";

export const employeeFormSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre del profesional.").max(120),
  phone: z.string().trim().max(30),
  email: z
    .string()
    .trim()
    .max(160)
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Ingresa un correo válido.",
    ),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

import { z } from "zod";

export const employeeFormSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre del profesional.").max(120),
  phone: z.string().trim().max(30),
  email: z.email("Ingresa un correo válido.").trim().max(160),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

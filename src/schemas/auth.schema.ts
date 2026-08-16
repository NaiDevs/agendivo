import { z } from "zod";

const emailSchema = z.email("Ingresa un correo válido.").trim().max(160);
const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(72, "La contraseña no puede exceder 72 caracteres.");

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const confirmSignUpSchema = z.object({
  email: emailSchema,
  token: z
    .string()
    .trim()
    .regex(/^\d{6,8}$/, "Ingresa el código numérico recibido por correo."),
});

export const registerAccountSchema = z
  .object({
    fullName: z.string().trim().min(2, "Ingresa tu nombre.").max(120),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export const configurePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type SignInValues = z.infer<typeof signInSchema>;
export type RegisterAccountValues = z.infer<typeof registerAccountSchema>;
export type ConfirmSignUpValues = z.infer<typeof confirmSignUpSchema>;
export type ConfigurePasswordValues = z.infer<typeof configurePasswordSchema>;

import { z } from "zod";

const optionalEmailSchema = z
  .string()
  .trim()
  .max(160)
  .refine(
    (value) => value === "" || z.email().safeParse(value).success,
    "Ingresa un correo válido.",
  );

const threeDigitCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{3}$/, "Debe contener exactamente 3 dígitos.");

const optionalFiscalText = z.string().trim().max(160);

export const businessOnboardingSchema = z
  .object({
    name: z.string().trim().min(2, "Ingresa el nombre del negocio.").max(120),
    phone: z.string().trim().max(30),
    email: optionalEmailSchema,
    address: z.string().trim().max(240),
    timezone: z.string().trim().min(1, "Selecciona una zona horaria."),
    currency: z
      .string()
      .trim()
      .length(3, "La moneda debe usar un código de tres letras.")
      .transform((value) => value.toUpperCase()),
    countryCode: z.string().trim().length(2),
    legalName: z
      .string()
      .trim()
      .min(2, "Ingresa la razón social o nombre legal.")
      .max(160),
    taxId: optionalFiscalText,
    invoicesEnabled: z.boolean(),
    establishmentName: optionalFiscalText,
    establishmentCode: z.string().trim(),
    emissionPointName: optionalFiscalText,
    emissionPointCode: z.string().trim(),
    cai: z.string().trim(),
    validUntil: z.string().trim(),
    rangeStart: z.coerce.number().int().nonnegative(),
    rangeEnd: z.coerce.number().int().nonnegative(),
    nextNumber: z.coerce.number().int().nonnegative(),
  })
  .superRefine((values, context) => {
    if (!values.invoicesEnabled) {
      return;
    }

    const requiredTextFields = [
      ["taxId", values.taxId, "Ingresa el RTN o identificador fiscal."],
      [
        "establishmentName",
        values.establishmentName,
        "Ingresa el nombre del establecimiento.",
      ],
      [
        "emissionPointName",
        values.emissionPointName,
        "Ingresa el nombre del punto de emisión.",
      ],
      ["cai", values.cai, "Ingresa el CAI de la autorización."],
      ["validUntil", values.validUntil, "Ingresa la fecha límite de emisión."],
    ] as const;

    for (const [field, value, message] of requiredTextFields) {
      if (value === "") {
        context.addIssue({ code: "custom", path: [field], message });
      }
    }

    for (const [field, value] of [
      ["establishmentCode", values.establishmentCode],
      ["emissionPointCode", values.emissionPointCode],
    ] as const) {
      const result = threeDigitCodeSchema.safeParse(value);
      if (!result.success) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: result.error.issues[0]?.message ?? "Código inválido.",
        });
      }
    }

    if (
      !/^[A-Za-z0-9]{6}(?:-[A-Za-z0-9]{6}){4}-[A-Za-z0-9]{2}$/.test(values.cai)
    ) {
      context.addIssue({
        code: "custom",
        path: ["cai"],
        message: "El CAI debe tener 37 caracteres en el formato autorizado.",
      });
    }
    if (values.rangeEnd < values.rangeStart) {
      context.addIssue({
        code: "custom",
        path: ["rangeEnd"],
        message: "El número final debe ser mayor o igual al inicial.",
      });
    }
    if (
      values.nextNumber < values.rangeStart ||
      values.nextNumber > values.rangeEnd
    ) {
      context.addIssue({
        code: "custom",
        path: ["nextNumber"],
        message: "El próximo número debe estar dentro del rango autorizado.",
      });
    }
  });

export type BusinessOnboardingValues = z.input<typeof businessOnboardingSchema>;

export const fiscalCorrelativeFormSchema = z
  .object({
    legalName: z.string().trim().min(2).max(160),
    taxId: z.string().trim().min(1, "Ingresa el RTN.").max(160),
    establishmentName: z.string().trim().min(1).max(160),
    establishmentCode: threeDigitCodeSchema,
    emissionPointName: z.string().trim().min(1).max(160),
    emissionPointCode: threeDigitCodeSchema,
    cai: z
      .string()
      .trim()
      .regex(
        /^[A-Za-z0-9]{6}(?:-[A-Za-z0-9]{6}){4}-[A-Za-z0-9]{2}$/,
        "El CAI debe tener 37 caracteres en el formato autorizado.",
      ),
    validUntil: z.string().trim().min(1, "Ingresa la fecha límite."),
    rangeStart: z.coerce.number().int().nonnegative(),
    rangeEnd: z.coerce.number().int().nonnegative(),
    nextNumber: z.coerce.number().int().nonnegative(),
  })
  .superRefine((values, context) => {
    if (values.rangeEnd < values.rangeStart) {
      context.addIssue({
        code: "custom",
        path: ["rangeEnd"],
        message: "El número final debe ser mayor o igual al inicial.",
      });
    }
    if (
      values.nextNumber < values.rangeStart ||
      values.nextNumber > values.rangeEnd
    ) {
      context.addIssue({
        code: "custom",
        path: ["nextNumber"],
        message: "El próximo número debe estar dentro del rango autorizado.",
      });
    }
  });

export type FiscalCorrelativeFormValues = z.input<
  typeof fiscalCorrelativeFormSchema
>;

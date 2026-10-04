import { z } from "zod";

import { CUSTOMER_CUSTOM_FIELD_TYPE } from "@/domain/entities/customer-custom-field";

export const customerCustomFieldFormSchema = z
  .object({
    name: z.string().trim().min(2, "Ingresa el nombre del campo.").max(120),
    type: z.enum([
      CUSTOMER_CUSTOM_FIELD_TYPE.TEXT,
      CUSTOMER_CUSTOM_FIELD_TYPE.TELEPHONE,
      CUSTOMER_CUSTOM_FIELD_TYPE.NUMBER,
      CUSTOMER_CUSTOM_FIELD_TYPE.BOOLEAN,
      CUSTOMER_CUSTOM_FIELD_TYPE.DATETIME,
      CUSTOMER_CUSTOM_FIELD_TYPE.EMAIL,
      CUSTOMER_CUSTOM_FIELD_TYPE.SELECT,
    ]),
    isRequired: z.boolean(),
    isMultiple: z.boolean(),
    options: z.array(z.string().trim().min(1)).max(50),
  })
  .superRefine((value, context) => {
    if (value.type !== CUSTOMER_CUSTOM_FIELD_TYPE.SELECT) {
      if (value.isMultiple) {
        context.addIssue({
          code: "custom",
          message: "La selección múltiple solo aplica a listas.",
          path: ["isMultiple"],
        });
      }
      return;
    }

    const normalizedOptions = value.options.map((option) =>
      option.toLocaleLowerCase(),
    );
    if (value.options.length < 2) {
      context.addIssue({
        code: "custom",
        message: "Agrega al menos dos opciones.",
        path: ["options"],
      });
    }
    if (new Set(normalizedOptions).size !== normalizedOptions.length) {
      context.addIssue({
        code: "custom",
        message: "Las opciones no pueden repetirse.",
        path: ["options"],
      });
    }
  })
  .transform((value) => ({
    ...value,
    isMultiple:
      value.type === CUSTOMER_CUSTOM_FIELD_TYPE.SELECT && value.isMultiple,
    options:
      value.type === CUSTOMER_CUSTOM_FIELD_TYPE.SELECT ? value.options : [],
  }));

export type CustomerCustomFieldFormValues = z.input<
  typeof customerCustomFieldFormSchema
>;

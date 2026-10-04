import { Controller, type Control, type FieldErrors } from "react-hook-form";

import { FieldError } from "@/components/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CUSTOMER_CUSTOM_FIELD_TYPE,
  type CustomerCustomField,
} from "@/domain/entities/customer-custom-field";
import type { CustomerFormValues } from "@/schemas/customer.schema";

interface CustomerCustomFieldControlProps {
  control: Control<CustomerFormValues>;
  errors: FieldErrors<CustomerFormValues>;
  field: CustomerCustomField;
}

function toLocalDateTime(value: unknown): string {
  if (typeof value !== "string" || value === "") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function CustomerCustomFieldControl({
  control,
  errors,
  field,
}: CustomerCustomFieldControlProps) {
  const inputId = `customer-custom-${field.id}`;
  const error = errors.customFieldValues?.[field.id];

  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>
        {field.name}
        {field.isRequired ? " *" : ""}
      </Label>
      <Controller
        control={control}
        name={`customFieldValues.${field.id}`}
        render={({ field: input }) => {
          if (field.type === CUSTOMER_CUSTOM_FIELD_TYPE.BOOLEAN) {
            return (
              <label className="border-input flex min-h-10 items-center gap-3 rounded-lg border px-3 text-sm">
                <input
                  checked={input.value === true}
                  id={inputId}
                  onBlur={input.onBlur}
                  onChange={(event) => input.onChange(event.target.checked)}
                  type="checkbox"
                />
                Sí
              </label>
            );
          }

          if (field.type === CUSTOMER_CUSTOM_FIELD_TYPE.SELECT) {
            return (
              <select
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-3"
                id={inputId}
                multiple={field.isMultiple}
                onBlur={input.onBlur}
                onChange={(event) =>
                  input.onChange(
                    field.isMultiple
                      ? Array.from(
                          event.target.selectedOptions,
                          (option) => option.value,
                        )
                      : event.target.value,
                  )
                }
                value={
                  field.isMultiple
                    ? Array.isArray(input.value)
                      ? input.value
                      : []
                    : typeof input.value === "string"
                      ? input.value
                      : ""
                }
              >
                {!field.isMultiple && <option value="">Seleccionar</option>}
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            );
          }

          const type =
            field.type === CUSTOMER_CUSTOM_FIELD_TYPE.NUMBER
              ? "number"
              : field.type === CUSTOMER_CUSTOM_FIELD_TYPE.EMAIL
                ? "email"
                : field.type === CUSTOMER_CUSTOM_FIELD_TYPE.TELEPHONE
                  ? "tel"
                  : field.type === CUSTOMER_CUSTOM_FIELD_TYPE.DATETIME
                    ? "datetime-local"
                    : "text";
          const value =
            field.type === CUSTOMER_CUSTOM_FIELD_TYPE.DATETIME
              ? toLocalDateTime(input.value)
              : typeof input.value === "string" ||
                  typeof input.value === "number"
                ? input.value
                : "";

          return (
            <Input
              id={inputId}
              onBlur={input.onBlur}
              onChange={(event) =>
                input.onChange(
                  field.type === CUSTOMER_CUSTOM_FIELD_TYPE.NUMBER
                    ? event.target.value === ""
                      ? null
                      : event.target.valueAsNumber
                    : event.target.value,
                )
              }
              type={type}
              value={value}
            />
          );
        }}
      />
      <FieldError
        message={
          error !== undefined && "message" in error ? error.message : undefined
        }
      />
    </div>
  );
}

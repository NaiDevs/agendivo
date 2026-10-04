import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Business } from "@/domain/entities/business";
import {
  businessFormSchema,
  type BusinessFormValues,
} from "@/schemas/business.schema";
import { useAppStore } from "@/stores/app.store";

const CURRENCY_OPTIONS = [
  { code: "HNL", label: "HNL — Lempira hondureño" },
  { code: "GTQ", label: "GTQ — Quetzal guatemalteco" },
  { code: "USD", label: "USD — Dólar estadounidense" },
  { code: "MXN", label: "MXN — Peso mexicano" },
  { code: "CRC", label: "CRC — Colón costarricense" },
  { code: "NIO", label: "NIO — Córdoba nicaragüense" },
  { code: "PAB", label: "PAB — Balboa panameño" },
  { code: "COP", label: "COP — Peso colombiano" },
] as const;

export function BusinessProfileForm({
  business,
  onClose,
}: {
  business: Business;
  onClose: () => void;
}) {
  const editBusinessProfile = useAppStore((state) => state.editBusinessProfile);
  const isSaving = useAppStore((state) => state.isSaving);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      name: business.name,
      phone: business.phone ?? "",
      email: business.email ?? "",
      address: business.address ?? "",
      timezone: business.timezone,
      currency: business.currency,
    },
  });
  const onSubmit = handleSubmit(async (values): Promise<void> => {
    if (await editBusinessProfile(values)) onClose();
  });
  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      <header className="border-b pb-5">
        <h2 className="text-lg font-semibold">Editar datos del negocio</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Actualiza la información operativa que usa Agendivo.
        </p>
      </header>
      <Field label="Nombre" error={errors.name?.message}>
        <Input {...register("name")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Teléfono" error={errors.phone?.message}>
          <Input {...register("phone")} />
        </Field>
        <Field label="Correo" error={errors.email?.message}>
          <Input type="email" {...register("email")} />
        </Field>
      </div>
      <Field label="Dirección" error={errors.address?.message}>
        <Input {...register("address")} />
      </Field>
      <Field label="Moneda" error={errors.currency?.message}>
        <select
          aria-label="Moneda"
          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/30 h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-3"
          {...register("currency")}
        >
          {!CURRENCY_OPTIONS.some(({ code }) => code === business.currency) && (
            <option value={business.currency}>{business.currency}</option>
          )}
          {CURRENCY_OPTIONS.map(({ code, label }) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3 border-t pt-5">
        <Button onClick={onClose} type="button" variant="outline">
          Cancelar
        </Button>
        <Button disabled={isSaving} type="submit">
          {isSaving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  children,
  error,
  label,
}: {
  children: ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error !== undefined && (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

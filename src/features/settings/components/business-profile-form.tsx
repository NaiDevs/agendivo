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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Zona horaria" error={errors.timezone?.message}>
          <Input {...register("timezone")} />
        </Field>
        <Field label="Moneda" error={errors.currency?.message}>
          <Input maxLength={3} {...register("currency")} />
        </Field>
      </div>
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

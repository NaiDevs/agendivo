import { zodResolver } from "@hookform/resolvers/zod";
import { useController, useForm } from "react-hook-form";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FiscalConfiguration } from "@/domain/entities/fiscal-configuration";
import {
  fiscalCorrelativeFormSchema,
  type FiscalCorrelativeFormValues,
} from "@/schemas/fiscal.schema";
import { useAppStore } from "@/stores/app.store";
import { formatCai } from "@/lib/format-cai";

interface FiscalCorrelativeFormProps {
  businessName: string;
  configuration: FiscalConfiguration | null;
  onClose: () => void;
}

export function FiscalCorrelativeForm({
  businessName,
  configuration,
  onClose,
}: FiscalCorrelativeFormProps) {
  const editFiscalCorrelative = useAppStore(
    (state) => state.editFiscalCorrelative,
  );
  const isSaving = useAppStore((state) => state.isSaving);
  const point = configuration?.emissionPoint ?? null;
  const authorization = configuration?.authorization ?? null;
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FiscalCorrelativeFormValues>({
    resolver: zodResolver(fiscalCorrelativeFormSchema),
    defaultValues: {
      legalName: configuration?.profile.legalName ?? businessName,
      taxId: configuration?.profile.taxId ?? "",
      establishmentName: point?.name ?? "Principal",
      establishmentCode: point?.establishmentCode ?? "001",
      emissionPointName: point?.name ?? "Caja principal",
      emissionPointCode: point?.emissionPointCode ?? "001",
      cai: authorization?.cai ?? "",
      validUntil: authorization?.validUntil ?? "",
      rangeStart: authorization?.rangeStart ?? 1,
      rangeEnd: authorization?.rangeEnd ?? 100,
      nextNumber: authorization?.nextNumber ?? 1,
    },
  });
  const { field: caiField } = useController({ control, name: "cai" });
  const onSubmit = handleSubmit(async (values): Promise<void> => {
    if (await editFiscalCorrelative(values)) onClose();
  });
  return (
    <form className="grid gap-6" onSubmit={onSubmit}>
      <header className="border-b pb-5">
        <h2 className="text-lg font-semibold">
          {authorization === null
            ? "Configurar correlativo fiscal"
            : "Editar correlativo fiscal"}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Copia los datos exactamente como aparecen en la autorización del SAR.
        </p>
      </header>
      <FormSection
        description="Razón social y RTN del negocio."
        title="Identidad fiscal"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.legalName?.message} label="Razón social">
            <Input {...register("legalName")} />
          </Field>
          <Field error={errors.taxId?.message} label="RTN">
            <Input {...register("taxId")} />
          </Field>
        </div>
      </FormSection>
      <FormSection
        description="Códigos autorizados de tres dígitos."
        title="Punto de emisión"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            error={errors.establishmentName?.message}
            label="Establecimiento"
          >
            <Input {...register("establishmentName")} />
          </Field>
          <Field
            error={errors.emissionPointName?.message}
            label="Punto de emisión"
          >
            <Input {...register("emissionPointName")} />
          </Field>
          <Field
            error={errors.establishmentCode?.message}
            label="Código de establecimiento"
          >
            <Input
              inputMode="numeric"
              maxLength={3}
              {...register("establishmentCode")}
            />
          </Field>
          <Field
            error={errors.emissionPointCode?.message}
            label="Código del punto"
          >
            <Input
              inputMode="numeric"
              maxLength={3}
              {...register("emissionPointCode")}
            />
          </Field>
        </div>
      </FormSection>
      <FormSection
        description="Escribe el CAI seguido; Agendivo agregará los guiones."
        title="Autorización y rango"
      >
        <Field error={errors.cai?.message} label="CAI">
          <Input
            {...caiField}
            autoCapitalize="characters"
            maxLength={37}
            placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-XX"
            onChange={(event) =>
              caiField.onChange(formatCai(event.target.value))
            }
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.validUntil?.message} label="Fecha límite">
            <Input type="date" {...register("validUntil")} />
          </Field>
          <Field error={errors.nextNumber?.message} label="Próximo correlativo">
            <Input min={0} type="number" {...register("nextNumber")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.rangeStart?.message} label="Rango inicial">
            <Input min={0} type="number" {...register("rangeStart")} />
          </Field>
          <Field error={errors.rangeEnd?.message} label="Rango final">
            <Input min={0} type="number" {...register("rangeEnd")} />
          </Field>
        </div>
      </FormSection>
      <div className="grid grid-cols-2 gap-3 border-t pt-5">
        <Button onClick={onClose} type="button" variant="outline">
          Cancelar
        </Button>
        <Button disabled={isSaving} type="submit">
          {isSaving ? "Guardando…" : "Guardar correlativo"}
        </Button>
      </div>
    </form>
  );
}

function FormSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="grid gap-4 border-b pb-6 last:border-0 last:pb-0">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-1 text-xs">{description}</p>
      </div>
      {children}
    </section>
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

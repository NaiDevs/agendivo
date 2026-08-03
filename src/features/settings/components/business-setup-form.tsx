import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  businessFormSchema,
  type BusinessFormValues,
} from "@/schemas/business.schema";
import { useAppStore } from "@/stores/app.store";

export function BusinessSetupForm() {
  const saveBusiness = useAppStore((state) => state.saveBusiness);
  const isSaving = useAppStore((state) => state.isSaving);
  const error = useAppStore((state) => state.error);
  const clearError = useAppStore((state) => state.clearError);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      timezone: "America/Guatemala",
      currency: "GTQ",
    },
  });

  const onSubmit = handleSubmit(async (values): Promise<void> => {
    clearError();
    await saveBusiness(values);
  });

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Configura tu negocio</CardTitle>
        <CardDescription>
          Esta información se guarda únicamente en este equipo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={onSubmit}>
          {error !== null && (
            <Alert variant="destructive">
              <AlertTitle>No pudimos guardar el negocio</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FormField
            error={errors.name?.message}
            label="Nombre del negocio"
            name="name"
          >
            <Input
              id="name"
              autoFocus
              placeholder="Barbería Central"
              {...register("name")}
            />
          </FormField>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              error={errors.phone?.message}
              label="Teléfono"
              name="phone"
            >
              <Input
                id="phone"
                placeholder="5555-5555"
                {...register("phone")}
              />
            </FormField>
            <FormField
              error={errors.email?.message}
              label="Correo"
              name="email"
            >
              <Input
                id="email"
                type="email"
                placeholder="negocio@ejemplo.com"
                {...register("email")}
              />
            </FormField>
          </div>

          <FormField
            error={errors.address?.message}
            label="Dirección"
            name="address"
          >
            <Input id="address" {...register("address")} />
          </FormField>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              error={errors.timezone?.message}
              label="Zona horaria"
              name="timezone"
            >
              <Input id="timezone" {...register("timezone")} />
            </FormField>
            <FormField
              error={errors.currency?.message}
              label="Moneda"
              name="currency"
            >
              <Input id="currency" maxLength={3} {...register("currency")} />
            </FormField>
          </div>

          <Button className="mt-2" disabled={isSaving} type="submit">
            {isSaving ? "Guardando…" : "Guardar y continuar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface FormFieldProps {
  children: ReactNode;
  error: string | undefined;
  label: string;
  name: string;
}

function FormField({ children, error, label, name }: FormFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error !== undefined && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

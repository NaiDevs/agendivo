import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";

import { FieldError } from "@/components/field-error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  employeeFormSchema,
  type EmployeeFormValues,
} from "@/schemas/employee.schema";
import { useAppStore } from "@/stores/app.store";

export function EmployeeForm() {
  const addEmployee = useAppStore((state) => state.addEmployee);
  const isSaving = useAppStore((state) => state.isSaving);
  const error = useAppStore((state) => state.error);
  const clearError = useAppStore((state) => state.clearError);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: { name: "", phone: "", email: "" },
  });

  const onSubmit = handleSubmit(async (values): Promise<void> => {
    clearError();
    if (await addEmployee(values)) {
      reset();
    }
  });

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-xl">
          <UserPlus className="size-5" />
        </div>
        <CardTitle>Nuevo profesional</CardTitle>
        <p className="text-muted-foreground text-sm">
          Agrégalo para poder asignarle citas.
        </p>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          {error !== null && (
            <Alert variant="destructive">
              <AlertTitle>No pudimos guardar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="employee-name">Nombre</Label>
            <Input
              id="employee-name"
              placeholder="Ej. Carlos Méndez"
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="employee-phone">Teléfono</Label>
            <Input
              id="employee-phone"
              placeholder="5555-5555"
              {...register("phone")}
            />
            <FieldError message={errors.phone?.message} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="employee-email">Correo</Label>
            <Input
              id="employee-email"
              type="email"
              placeholder="nombre@ejemplo.com"
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </div>
          <Button className="mt-1 h-10" disabled={isSaving} type="submit">
            {isSaving ? "Guardando…" : "Agregar al equipo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

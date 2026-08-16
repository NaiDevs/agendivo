import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, UserPlus } from "lucide-react";
import { useEffect } from "react";
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
import type { Employee } from "@/domain/entities/employee";

interface EmployeeFormProps {
  employee: Employee | null;
  onCancelEdit: () => void;
  onSaved: () => void;
}

export function EmployeeForm({
  employee,
  onCancelEdit,
  onSaved,
}: EmployeeFormProps) {
  const addEmployee = useAppStore((state) => state.addEmployee);
  const editEmployee = useAppStore((state) => state.editEmployee);
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

  useEffect(() => {
    reset({
      name: employee?.name ?? "",
      phone: employee?.phone ?? "",
      email: employee?.email ?? "",
    });
  }, [employee, reset]);

  const onSubmit = handleSubmit(async (values): Promise<void> => {
    clearError();
    const saved =
      employee === null
        ? await addEmployee(values)
        : await editEmployee(employee.id, values);
    if (saved) {
      reset();
      onSaved();
    }
  });

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-xl">
          {employee === null ? (
            <UserPlus className="size-5" />
          ) : (
            <Pencil className="size-5" />
          )}
        </div>
        <CardTitle>
          {employee === null ? "Nuevo profesional" : "Editar profesional"}
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          {employee === null
            ? "Recibirá un correo para crear su contraseña y acceder a Agendivo."
            : "Actualiza sus datos visibles dentro del equipo."}
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
          {employee !== null && (
            <Button onClick={onCancelEdit} type="button" variant="outline">
              Cancelar edición
            </Button>
          )}
          <Button className="mt-1 h-10" disabled={isSaving} type="submit">
            {isSaving
              ? "Guardando…"
              : employee === null
                ? "Invitar al equipo"
                : "Guardar cambios"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

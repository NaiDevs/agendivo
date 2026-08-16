import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Scissors } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { FieldError } from "@/components/field-error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  serviceFormSchema,
  type ServiceFormValues,
} from "@/schemas/service.schema";
import { useAppStore } from "@/stores/app.store";
import type { Service } from "@/domain/entities/service";

interface ServiceFormProps {
  service: Service | null;
  onCancelEdit: () => void;
  onSaved: () => void;
}

export function ServiceForm({
  service,
  onCancelEdit,
  onSaved,
}: ServiceFormProps) {
  const addService = useAppStore((state) => state.addService);
  const editService = useAppStore((state) => state.editService);
  const isSaving = useAppStore((state) => state.isSaving);
  const error = useAppStore((state) => state.error);
  const clearError = useAppStore((state) => state.clearError);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: { name: "", description: "", durationMinutes: 30, price: 0 },
  });

  useEffect(() => {
    reset({
      name: service?.name ?? "",
      description: service?.description ?? "",
      durationMinutes: service?.durationMinutes ?? 30,
      price: service === null ? 0 : service.price / 100,
    });
  }, [reset, service]);

  const onSubmit = handleSubmit(async (values): Promise<void> => {
    clearError();
    const saved =
      service === null
        ? await addService(values)
        : await editService(service.id, values);
    if (saved) {
      reset({ name: "", description: "", durationMinutes: 30, price: 0 });
      onSaved();
    }
  });

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-xl">
          {service === null ? (
            <Scissors className="size-5" />
          ) : (
            <Pencil className="size-5" />
          )}
        </div>
        <CardTitle>
          {service === null ? "Nuevo servicio" : "Editar servicio"}
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Define tiempo y precio para agendarlo después.
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
            <Label htmlFor="service-name">Nombre</Label>
            <Input
              id="service-name"
              placeholder="Ej. Corte clásico"
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="service-duration">Duración (min)</Label>
              <Input
                id="service-duration"
                min={5}
                step={5}
                type="number"
                {...register("durationMinutes", { valueAsNumber: true })}
              />
              <FieldError message={errors.durationMinutes?.message} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="service-price">Precio</Label>
              <Input
                id="service-price"
                min={0}
                step="0.01"
                type="number"
                {...register("price", { valueAsNumber: true })}
              />
              <FieldError message={errors.price?.message} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="service-description">Descripción</Label>
            <textarea
              id="service-description"
              className="border-input focus-visible:border-ring focus-visible:ring-ring/30 min-h-20 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-3"
              placeholder="Opcional"
              {...register("description")}
            />
            <FieldError message={errors.description?.message} />
          </div>
          {service !== null && (
            <Button onClick={onCancelEdit} type="button" variant="outline">
              Cancelar edición
            </Button>
          )}
          <Button className="mt-1 h-10" disabled={isSaving} type="submit">
            {isSaving ? "Guardando…" : "Crear servicio"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

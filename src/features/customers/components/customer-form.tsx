import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { UserPlus } from "lucide-react";

import { FieldError } from "@/components/field-error";
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
  customerFormSchema,
  type CustomerFormValues,
} from "@/schemas/customer.schema";
import { useAppStore } from "@/stores/app.store";

export function CustomerForm() {
  const addCustomer = useAppStore((state) => state.addCustomer);
  const isSaving = useAppStore((state) => state.isSaving);
  const error = useAppStore((state) => state.error);
  const clearError = useAppStore((state) => state.clearError);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: { name: "", phone: "", email: "", notes: "" },
  });

  const onSubmit = handleSubmit(async (values): Promise<void> => {
    clearError();
    const saved = await addCustomer(values);
    if (saved) {
      reset();
    }
  });

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-xl">
          <UserPlus className="size-5" />
        </div>
        <CardTitle>Nuevo cliente</CardTitle>
        <CardDescription>
          Nombre es obligatorio; los demás datos son opcionales.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          {error !== null && (
            <Alert variant="destructive">
              <AlertTitle>No pudimos guardar el cliente</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="customer-name">Nombre</Label>
            <Input
              id="customer-name"
              placeholder="Nombre completo"
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="customer-phone">Teléfono</Label>
              <Input id="customer-phone" {...register("phone")} />
              <FieldError message={errors.phone?.message} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-email">Correo</Label>
              <Input id="customer-email" type="email" {...register("email")} />
              <FieldError message={errors.email?.message} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customer-notes">Notas</Label>
            <textarea
              id="customer-notes"
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3"
              {...register("notes")}
            />
            <FieldError message={errors.notes?.message} />
          </div>

          <Button className="mt-1 h-10" disabled={isSaving} type="submit">
            {isSaving ? "Guardando…" : "Registrar cliente"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

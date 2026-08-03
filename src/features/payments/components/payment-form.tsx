import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Banknote, ChevronDown, X } from "lucide-react";
import { type ChangeEvent, type ReactNode } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";

import { FieldError } from "@/components/field-error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAYMENT_METHOD } from "@/domain/entities/payment";
import { paymentMethodLabel } from "@/features/payments/payment-presenter";
import { formatMoney } from "@/lib/format-money";
import {
  paymentFormSchema,
  type PaymentFormValues,
} from "@/schemas/payment.schema";
import { useAppStore } from "@/stores/app.store";

interface PaymentFormProps {
  lockedAppointmentId?: string;
  lockedCustomerId?: string;
  onSaved?: () => void;
  onClose?: () => void;
}

const methods = Object.values(PAYMENT_METHOD);

export function PaymentForm({
  lockedAppointmentId,
  lockedCustomerId,
  onSaved,
  onClose,
}: PaymentFormProps) {
  const business = useAppStore((state) => state.business);
  const customers = useAppStore((state) => state.customers);
  const appointments = useAppStore((state) => state.appointments);
  const addPayment = useAppStore((state) => state.addPayment);
  const appointmentBalance = useAppStore((state) => state.appointmentBalance);
  const isSaving = useAppStore((state) => state.isSaving);
  const error = useAppStore((state) => state.error);
  const clearError = useAppStore((state) => state.clearError);
  const currency = business?.currency ?? "GTQ";

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: getDefaultValues(
      lockedAppointmentId,
      lockedCustomerId,
      appointmentBalance,
    ),
  });

  const [selectedCustomer, selectedAppointment] = useWatch({
    control,
    name: ["customerId", "appointmentId"],
  });

  const customerAppointments = appointments.filter(
    (appointment) => appointment.customerId === selectedCustomer,
  );
  const balance =
    selectedAppointment === "" ? null : appointmentBalance(selectedAppointment);

  const appointmentRegistration = register("appointmentId", {
    onChange: (event: ChangeEvent<HTMLSelectElement>): void => {
      const value = event.target.value;
      if (value !== "") {
        setValue("amount", appointmentBalance(value) / 100, {
          shouldValidate: true,
        });
      }
    },
  });

  const onSubmit = handleSubmit(async (values): Promise<void> => {
    clearError();
    if (await addPayment(values)) {
      reset(
        getDefaultValues(
          lockedAppointmentId,
          lockedCustomerId,
          appointmentBalance,
        ),
      );
      onSaved?.();
    }
  });

  return (
    <div className="surface-card flex flex-col overflow-hidden">
      <div className="bg-sidebar flex shrink-0 items-start justify-between gap-4 px-5 py-4 text-white">
        <div>
          <p className="text-primary text-xs font-bold tracking-wider uppercase">
            Nuevo pago
          </p>
          <h2 className="mt-1 text-lg font-semibold">Registrar cobro</h2>
        </div>
        {onClose !== undefined && (
          <Button
            aria-label="Cerrar formulario"
            className="border-white/10 bg-white/8 text-white hover:bg-white/15"
            onClick={onClose}
            size="icon"
            type="button"
            variant="outline"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
      <form className="grid gap-4 p-5" onSubmit={onSubmit}>
        {error !== null && (
          <Alert variant="destructive">
            <AlertTitle>No pudimos registrar el pago</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <FormSelect
          disabled={lockedCustomerId !== undefined}
          error={errors.customerId?.message}
          id="payment-customer"
          label="Cliente"
          registration={register("customerId")}
        >
          <option value="">Selecciona un cliente</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </FormSelect>
        <FormSelect
          disabled={lockedAppointmentId !== undefined}
          error={errors.appointmentId?.message}
          id="payment-appointment"
          label="Cita"
          optional
          registration={appointmentRegistration}
        >
          <option value="">Sin cita (venta suelta)</option>
          {customerAppointments.map((appointment) => (
            <option key={appointment.id} value={appointment.id}>
              {format(new Date(appointment.startsAt), "dd/MM HH:mm")} · saldo{" "}
              {formatMoney(appointmentBalance(appointment.id), currency)}
            </option>
          ))}
        </FormSelect>
        {balance !== null && (
          <p className="text-muted-foreground -mt-1 text-xs">
            Saldo pendiente de la cita:{" "}
            <span className="text-foreground font-semibold">
              {formatMoney(balance, currency)}
            </span>
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="field-group">
            <Label htmlFor="payment-amount">Monto</Label>
            <div className="relative">
              <Banknote className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                className="pl-9"
                id="payment-amount"
                min={0}
                step="0.01"
                type="number"
                {...register("amount", { valueAsNumber: true })}
              />
            </div>
            <FieldError message={errors.amount?.message} />
          </div>
          <FormSelect
            error={errors.method?.message}
            id="payment-method"
            label="Método"
            registration={register("method")}
          >
            {methods.map((method) => (
              <option key={method} value={method}>
                {paymentMethodLabel[method]}
              </option>
            ))}
          </FormSelect>
        </div>
        <div className="field-group">
          <Label htmlFor="payment-paid-at">Fecha y hora</Label>
          <Input
            id="payment-paid-at"
            type="datetime-local"
            {...register("paidAt")}
          />
          <FieldError message={errors.paidAt?.message} />
        </div>
        <div className="field-group">
          <div className="flex items-center justify-between">
            <Label htmlFor="payment-notes">Notas</Label>
            <span className="text-muted-foreground text-[11px]">Opcional</span>
          </div>
          <textarea
            id="payment-notes"
            className="border-input bg-card focus-visible:border-ring focus-visible:ring-ring/20 min-h-16 w-full resize-y rounded-xl border px-3 py-2.5 text-sm shadow-xs transition-all outline-none focus-visible:ring-3"
            {...register("notes")}
          />
          <FieldError message={errors.notes?.message} />
        </div>
        <Button className="h-10" disabled={isSaving} type="submit">
          <Banknote className="size-4" />
          {isSaving ? "Guardando…" : "Registrar pago"}
        </Button>
      </form>
    </div>
  );
}

interface FormSelectProps {
  children: ReactNode;
  disabled?: boolean;
  error: string | undefined;
  id: string;
  label: string;
  optional?: boolean;
  registration: UseFormRegisterReturn;
}

function FormSelect({
  children,
  disabled = false,
  error,
  id,
  label,
  optional = false,
  registration,
}: FormSelectProps) {
  return (
    <div className="field-group">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {optional && (
          <span className="text-muted-foreground text-[11px]">Opcional</span>
        )}
      </div>
      <div className="relative">
        <select
          className="border-input bg-card focus-visible:border-ring focus-visible:ring-ring/20 h-11 w-full appearance-none rounded-xl border px-3 pr-9 text-sm shadow-xs transition-all outline-none focus-visible:ring-3 disabled:opacity-70"
          disabled={disabled}
          id={id}
          {...registration}
        >
          {children}
        </select>
        <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
      </div>
      <FieldError message={error} />
    </div>
  );
}

function getDefaultValues(
  lockedAppointmentId: string | undefined,
  lockedCustomerId: string | undefined,
  appointmentBalance: (appointmentId: string) => number,
): PaymentFormValues {
  return {
    customerId: lockedCustomerId ?? "",
    appointmentId: lockedAppointmentId ?? "",
    amount:
      lockedAppointmentId === undefined
        ? 0
        : appointmentBalance(lockedAppointmentId) / 100,
    method: PAYMENT_METHOD.CASH,
    paidAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: "",
  };
}

import { zodResolver } from "@hookform/resolvers/zod";
import { addMinutes, differenceInMinutes, format } from "date-fns";
import {
  Banknote,
  CalendarPlus,
  ChevronDown,
  Clock3,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, type ChangeEvent, type ReactNode } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";

import { FieldError } from "@/components/field-error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  APPOINTMENT_STATUS,
  type Appointment,
} from "@/domain/entities/appointment";
import { appointmentStatusLabel } from "@/features/appointments/appointment-presenter";
import { formatMoney } from "@/lib/format-money";
import {
  appointmentFormSchema,
  type AppointmentFormValues,
} from "@/schemas/appointment.schema";
import { useAppStore } from "@/stores/app.store";

interface AppointmentFormProps {
  appointment: Appointment | null;
  initialStartsAt: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const statuses = Object.values(APPOINTMENT_STATUS);

export function AppointmentForm({
  appointment,
  initialStartsAt,
  onClose,
  onSaved,
}: AppointmentFormProps) {
  const business = useAppStore((state) => state.business);
  const customers = useAppStore((state) => state.customers);
  const employees = useAppStore((state) => state.employees);
  const services = useAppStore((state) => state.services);
  const addAppointment = useAppStore((state) => state.addAppointment);
  const editAppointment = useAppStore((state) => state.editAppointment);
  const cancel = useAppStore((state) => state.cancelAppointment);
  const isSaving = useAppStore((state) => state.isSaving);
  const error = useAppStore((state) => state.error);
  const clearError = useAppStore((state) => state.clearError);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: getDefaultValues(appointment, initialStartsAt),
  });

  useEffect(() => {
    clearError();
    reset(getDefaultValues(appointment, initialStartsAt));
  }, [appointment, clearError, initialStartsAt, reset]);

  const [selectedStart, selectedDuration, selectedPrice] = useWatch({
    control,
    name: ["startsAt", "durationMinutes", "price"],
  });
  const estimatedEnd =
    selectedStart !== "" &&
    Number.isFinite(selectedDuration) &&
    !Number.isNaN(new Date(selectedStart).getTime())
      ? addMinutes(new Date(selectedStart), selectedDuration)
      : null;
  const serviceRegistration = register("serviceId", {
    onChange: (event: ChangeEvent<HTMLSelectElement>): void => {
      const service = services.find((item) => item.id === event.target.value);
      if (service !== undefined) {
        setValue("durationMinutes", service.durationMinutes, {
          shouldValidate: true,
        });
        setValue("price", service.price / 100, { shouldValidate: true });
      }
    },
  });

  const onSubmit = handleSubmit(async (values): Promise<void> => {
    const saved =
      appointment === null
        ? await addAppointment(values)
        : await editAppointment(appointment.id, values);
    if (saved) onSaved();
  });

  const onCancelAppointment = async (): Promise<void> => {
    if (
      appointment === null ||
      !window.confirm(
        "¿Cancelar esta cita? El horario volverá a estar disponible.",
      )
    )
      return;
    if (await cancel(appointment.id)) onSaved();
  };

  return (
    <aside className="surface-card page-enter flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden xl:h-full xl:max-h-none">
      <div className="bg-sidebar flex shrink-0 items-start justify-between gap-4 px-5 py-4 text-white">
        <div>
          <p className="text-primary text-xs font-bold tracking-wider uppercase">
            {appointment === null ? "Nueva cita" : "Editar cita"}
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {appointment === null
              ? "Reserva un horario"
              : "Detalles de la reserva"}
          </h2>
        </div>
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
      </div>
      <form className="grid gap-4 overflow-y-auto p-5" onSubmit={onSubmit}>
        {error !== null && (
          <Alert variant="destructive">
            <AlertTitle>No pudimos guardar la cita</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <FormSelect
          error={errors.customerId?.message}
          id="appointment-customer"
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
          error={errors.employeeId?.message}
          id="appointment-employee"
          label="Profesional"
          optional
          registration={register("employeeId")}
        >
          <option value="">Sin profesional asignado</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </FormSelect>
        <FormSelect
          error={errors.serviceId?.message}
          id="appointment-service"
          label="Servicio"
          optional
          registration={serviceRegistration}
        >
          <option value="">Sin servicio</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </FormSelect>
        <div className="field-group">
          <Label htmlFor="appointment-start">Fecha y hora</Label>
          <Input
            id="appointment-start"
            type="datetime-local"
            {...register("startsAt")}
          />
          <FieldError message={errors.startsAt?.message} />
        </div>
        {appointment !== null && (
          <FormSelect
            error={errors.status?.message}
            id="appointment-status"
            label="Estado"
            registration={register("status")}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {appointmentStatusLabel[status]}
              </option>
            ))}
          </FormSelect>
        )}
        {appointment === null && (
          <input type="hidden" {...register("status")} />
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="field-group">
            <Label htmlFor="appointment-duration">Duración</Label>
            <div className="relative">
              <Clock3 className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                className="pr-14 pl-9"
                id="appointment-duration"
                min={5}
                step={5}
                type="number"
                {...register("durationMinutes", { valueAsNumber: true })}
              />
              <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                min
              </span>
            </div>
            <FieldError message={errors.durationMinutes?.message} />
          </div>
          <div className="field-group">
            <Label htmlFor="appointment-price">Precio</Label>
            <div className="relative">
              <Banknote className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                className="pl-9"
                id="appointment-price"
                min={0}
                step="0.01"
                type="number"
                {...register("price", { valueAsNumber: true })}
              />
            </div>
            <FieldError message={errors.price?.message} />
          </div>
        </div>
        <div className="bg-secondary/65 grid grid-cols-2 gap-3 rounded-2xl border border-transparent p-3.5 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Finaliza</p>
            <p className="mt-1 flex items-center gap-1.5 font-semibold">
              <Clock3 className="size-4" />
              {estimatedEnd === null ? "—" : format(estimatedEnd, "HH:mm")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Precio</p>
            <p className="mt-1 font-semibold">
              {formatMoney(
                Number.isFinite(selectedPrice)
                  ? Math.round(selectedPrice * 100)
                  : 0,
                business?.currency ?? "GTQ",
              )}
            </p>
          </div>
        </div>
        <div className="field-group">
          <div className="flex items-center justify-between">
            <Label htmlFor="appointment-notes">Notas</Label>
            <span className="text-muted-foreground text-[11px]">Opcional</span>
          </div>
          <textarea
            id="appointment-notes"
            className="border-input bg-card focus-visible:border-ring focus-visible:ring-ring/20 min-h-20 w-full resize-y rounded-xl border px-3 py-2.5 text-sm shadow-xs transition-all outline-none focus-visible:ring-3"
            {...register("notes")}
          />
          <FieldError message={errors.notes?.message} />
        </div>
        <Button className="h-10" disabled={isSaving} type="submit">
          <CalendarPlus className="size-4" />
          {isSaving
            ? "Guardando…"
            : appointment === null
              ? "Crear cita"
              : "Guardar cambios"}
        </Button>
        {appointment !== null &&
          appointment.status !== APPOINTMENT_STATUS.CANCELLED && (
            <Button
              className="h-9"
              disabled={isSaving}
              onClick={() => void onCancelAppointment()}
              type="button"
              variant="destructive"
            >
              <Trash2 className="size-4" />
              Cancelar cita
            </Button>
          )}
      </form>
    </aside>
  );
}

interface FormSelectProps {
  children: ReactNode;
  error: string | undefined;
  id: string;
  label: string;
  optional?: boolean;
  registration: UseFormRegisterReturn;
}

function FormSelect({
  children,
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
          className="border-input bg-card focus-visible:border-ring focus-visible:ring-ring/20 h-11 w-full appearance-none rounded-xl border px-3 pr-9 text-sm shadow-xs transition-all outline-none focus-visible:ring-3"
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
  appointment: Appointment | null,
  initialStartsAt: string | null,
): AppointmentFormValues {
  return {
    customerId: appointment?.customerId ?? "",
    employeeId: appointment?.employeeId ?? "",
    serviceId: appointment?.serviceId ?? "",
    startsAt:
      appointment === null
        ? toLocalInput(initialStartsAt ?? new Date().toISOString())
        : toLocalInput(appointment.startsAt),
    status: appointment?.status ?? APPOINTMENT_STATUS.PENDING,
    durationMinutes:
      appointment === null
        ? 30
        : differenceInMinutes(
            new Date(appointment.endsAt),
            new Date(appointment.startsAt),
          ),
    price: appointment === null ? 0 : appointment.price / 100,
    notes: appointment?.notes ?? "",
  };
}

function toLocalInput(value: string): string {
  return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
}

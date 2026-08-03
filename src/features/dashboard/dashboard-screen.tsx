import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  Scissors,
  Users,
  UsersRound,
} from "lucide-react";
import { isSameDay } from "date-fns";

import { APP_SECTION, type AppSection } from "@/app/navigation";
import { Button } from "@/components/ui/button";
import { APPOINTMENT_STATUS } from "@/domain/entities/appointment";
import { useAppStore } from "@/stores/app.store";

interface DashboardScreenProps {
  onNavigate: (section: AppSection) => void;
}

export function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const business = useAppStore((state) => state.business);
  const customers = useAppStore((state) => state.customers);
  const employees = useAppStore((state) => state.employees);
  const services = useAppStore((state) => state.services);
  const appointments = useAppStore((state) => state.appointments);
  const todayAppointments = appointments.filter(
    (appointment) =>
      appointment.status !== APPOINTMENT_STATUS.CANCELLED &&
      appointment.status !== APPOINTMENT_STATUS.NO_SHOW &&
      isSameDay(new Date(appointment.startsAt), new Date()),
  ).length;

  return (
    <section className="page-enter grid gap-7">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Panel general</p>
          <h1 className="page-title">Hola, {business?.name}</h1>
          <p className="page-description">
            Todo listo para gestionar tu negocio desde este equipo.
          </p>
        </div>
        <Button
          className="h-10 gap-2 self-start px-4 md:self-auto"
          onClick={() => onNavigate(APP_SECTION.APPOINTMENTS)}
        >
          <CalendarPlus className="size-4" />
          Nueva cita
        </Button>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={CalendarDays}
          label="Citas hoy"
          value={todayAppointments}
        />
        <MetricCard icon={Users} label="Clientes" value={customers.length} />
        <MetricCard
          icon={UsersRound}
          label="Profesionales"
          value={employees.length}
        />
        <MetricCard icon={Scissors} label="Servicios" value={services.length} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="hero-panel relative overflow-hidden p-6 sm:p-8">
          <div className="relative z-10 max-w-lg">
            <span className="bg-primary/15 text-primary inline-flex rounded-full px-3 py-1 text-xs font-semibold">
              Agenda local
            </span>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Tu calendario ya está listo para recibir citas
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Reserva horarios, actualiza estados y evita automáticamente cruces
              por profesional.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="h-10"
                onClick={() => onNavigate(APP_SECTION.APPOINTMENTS)}
              >
                Abrir agenda
              </Button>
              <Button
                className="h-10 border-white/15 bg-white/8 text-white hover:bg-white/14"
                variant="outline"
                onClick={() => onNavigate(APP_SECTION.CUSTOMERS)}
              >
                Registrar cliente
              </Button>
            </div>
          </div>
          <div className="bg-primary/15 absolute -right-20 -bottom-32 size-80 rounded-full blur-3xl" />
        </div>
        <div className="surface-card p-5 sm:p-6">
          <p className="eyebrow">Configuración</p>
          <h2 className="mt-1 text-lg font-semibold">Avance del negocio</h2>
          <div className="mt-5 grid gap-3">
            <SetupItem complete label="Información del negocio" />
            <SetupItem
              complete={employees.length > 0}
              label="Agregar profesionales"
            />
            <SetupItem complete={services.length > 0} label="Crear servicios" />
            <SetupItem
              complete={customers.length > 0}
              label="Registrar clientes"
            />
          </div>
        </div>
      </div>
      <div>
        <div className="mb-4">
          <p className="eyebrow">Accesos rápidos</p>
          <h2 className="mt-1 text-lg font-semibold">¿Qué quieres hacer?</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <QuickAction
            label="Registrar cliente"
            description="Guarda sus datos de contacto"
            onClick={() => onNavigate(APP_SECTION.CUSTOMERS)}
          />
          <QuickAction
            label="Agregar profesional"
            description="Amplía el equipo de atención"
            onClick={() => onNavigate(APP_SECTION.EMPLOYEES)}
          />
          <QuickAction
            label="Crear servicio"
            description="Define duración y precio"
            onClick={() => onNavigate(APP_SECTION.SERVICES)}
          />
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <article className="surface-card flex items-center gap-4 p-5">
      <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-bold">{value}</p>
      </div>
    </article>
  );
}

function SetupItem({ complete, label }: { complete: boolean; label: string }) {
  return (
    <div className="bg-secondary/60 flex items-center gap-3 rounded-xl px-3 py-3">
      <span
        className={`${complete ? "bg-emerald-500" : "bg-border"} size-2 rounded-full`}
      />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-muted-foreground ml-auto text-xs">
        {complete ? "Listo" : "Pendiente"}
      </span>
    </div>
  );
}

function QuickAction({
  description,
  label,
  onClick,
}: {
  description: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="surface-card group flex min-h-24 items-center gap-4 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
      onClick={onClick}
      type="button"
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{label}</p>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>
      <ArrowRight className="text-primary size-5 transition group-hover:translate-x-1" />
    </button>
  );
}

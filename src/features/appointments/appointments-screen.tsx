import esLocale from "@fullcalendar/core/locales/es";
import type {
  DateSelectArg,
  EventClickArg,
  EventInput,
} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { CalendarPlus, CircleAlert, Pencil } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AppointmentForm } from "@/features/appointments/components/appointment-form";
import { appointmentColor } from "@/features/appointments/appointment-presenter";
import { useAppStore } from "@/stores/app.store";

export function AppointmentsScreen() {
  const appointments = useAppStore((state) => state.appointments);
  const customers = useAppStore((state) => state.customers);
  const services = useAppStore((state) => state.services);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const [selectedStartsAt, setSelectedStartsAt] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const selectedAppointment =
    appointments.find((item) => item.id === selectedAppointmentId) ?? null;
  const readyToSchedule = customers.length > 0;
  const events: EventInput[] = appointments.map((appointment) => ({
    id: appointment.id,
    title: `${customers.find((item) => item.id === appointment.customerId)?.name ?? "Cliente"} · ${appointment.serviceItems.map((item) => item.name).join(" + ") || services.find((item) => item.id === appointment.serviceId)?.name || "Cita general"}`,
    start: appointment.startsAt,
    end: appointment.endsAt,
    backgroundColor: appointmentColor(appointment.status),
    borderColor: "transparent",
  }));

  const startNewAppointment = (startsAt?: string): void => {
    setSelectedAppointmentId(null);
    setSelectedStartsAt(startsAt ?? new Date().toISOString());
    setShowForm(true);
  };

  const onSelect = (selection: DateSelectArg): void => {
    selection.view.calendar.unselect();
    if (readyToSchedule) startNewAppointment(selection.start.toISOString());
  };

  const onEventClick = (eventClick: EventClickArg): void => {
    setSelectedAppointmentId(eventClick.event.id);
    setSelectedStartsAt(null);
    setShowForm(true);
  };

  return (
    <section className="page-enter flex flex-col gap-5 lg:h-[calc(100vh-8rem)]">
      <header className="flex shrink-0 flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Operación diaria</p>
          <h1 className="page-title">Agenda</h1>
          <p className="page-description">
            Haz clic en un horario para reservar o en una cita para editarla.
          </p>
        </div>
        <Button
          className="h-10 gap-2 self-start px-4 md:self-auto"
          disabled={!readyToSchedule}
          onClick={() => startNewAppointment()}
        >
          <CalendarPlus className="size-4" />
          Nueva cita
        </Button>
      </header>

      {!readyToSchedule && <MissingData />}

      <div
        className={
          showForm
            ? "grid min-h-0 flex-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_380px]"
            : "grid min-h-0 flex-1"
        }
      >
        <div className="calendar-surface surface-card min-h-[620px] min-w-0 p-3 sm:p-5 lg:min-h-0">
          <FullCalendar
            allDaySlot={false}
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5, 6],
              startTime: "08:00",
              endTime: "19:00",
            }}
            dayMaxEvents
            events={events}
            eventClick={onEventClick}
            eventContent={(eventInfo) => (
              <button
                aria-label={`Editar ${eventInfo.event.title}`}
                className="flex w-full items-center justify-between gap-1 overflow-hidden px-1 text-left"
                type="button"
              >
                <span className="truncate">{eventInfo.event.title}</span>
                <Pencil className="size-3 shrink-0" />
              </button>
            )}
            expandRows
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            height="100%"
            initialView="timeGridWeek"
            locale={esLocale}
            nowIndicator
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            select={onSelect}
            selectable={readyToSchedule}
            selectMirror
            slotDuration="00:30:00"
            slotLabelInterval="01:00"
            slotMaxTime="21:00:00"
            slotMinTime="07:00:00"
          />
        </div>
        {showForm && (
          <AppointmentForm
            appointment={selectedAppointment}
            initialStartsAt={selectedStartsAt}
            onClose={() => setShowForm(false)}
            onSaved={() => setShowForm(false)}
          />
        )}
      </div>
    </section>
  );
}

function MissingData() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-amber-950">
      <CircleAlert className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-semibold">Registra un cliente antes de agendar</p>
        <p className="mt-1 text-sm text-amber-900/75">
          El profesional y el servicio son opcionales.
        </p>
      </div>
    </div>
  );
}

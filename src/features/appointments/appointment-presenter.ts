import {
  APPOINTMENT_STATUS,
  type AppointmentStatus,
} from "@/domain/entities/appointment";

export const appointmentStatusLabel: Record<AppointmentStatus, string> = {
  [APPOINTMENT_STATUS.PENDING]: "Pendiente",
  [APPOINTMENT_STATUS.CONFIRMED]: "Confirmada",
  [APPOINTMENT_STATUS.COMPLETED]: "Completada",
  [APPOINTMENT_STATUS.CANCELLED]: "Cancelada",
  [APPOINTMENT_STATUS.NO_SHOW]: "No asistió",
};

export function appointmentColor(status: AppointmentStatus): string {
  switch (status) {
    case APPOINTMENT_STATUS.CONFIRMED:
      return "var(--appointment-confirmed)";
    case APPOINTMENT_STATUS.COMPLETED:
      return "var(--appointment-completed)";
    case APPOINTMENT_STATUS.CANCELLED:
      return "var(--appointment-cancelled)";
    case APPOINTMENT_STATUS.NO_SHOW:
      return "var(--appointment-no-show)";
    case APPOINTMENT_STATUS.PENDING:
      return "var(--appointment-pending)";
  }
}

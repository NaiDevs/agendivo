export class AppointmentConflictError extends Error {
  constructor() {
    super("Ese profesional ya tiene una cita durante el horario seleccionado.");
    this.name = "AppointmentConflictError";
  }
}

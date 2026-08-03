export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    if (error.message.includes("APPOINTMENT_OVERLAP")) {
      return "Ese profesional ya tiene una cita durante el horario seleccionado.";
    }
    return error.message;
  }

  return "Ocurrió un error inesperado. Intenta nuevamente.";
}

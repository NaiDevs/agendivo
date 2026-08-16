import { describe, expect, it } from "vitest";

import {
  authErrorMessage,
  isEmailConfirmationRequired,
} from "@/stores/auth.store";

describe("authErrorMessage", () => {
  it("traduce el límite de correos de Supabase", () => {
    expect(authErrorMessage(new Error("email rate limit exceeded"))).toBe(
      "Alcanzamos temporalmente el límite de correos. Revisa si ya recibiste el primero o espera hasta una hora antes de intentarlo nuevamente.",
    );
  });

  it("conserva los mensajes no reconocidos", () => {
    expect(authErrorMessage(new Error("Error inesperado"))).toBe(
      "Error inesperado",
    );
  });

  it("traduce códigos de confirmación vencidos", () => {
    expect(authErrorMessage(new Error("Token has expired or is invalid"))).toBe(
      "El código es inválido o venció. Solicita uno nuevo e inténtalo otra vez.",
    );
  });

  it("detecta cuando Supabase exige confirmar el correo", () => {
    expect(isEmailConfirmationRequired(new Error("Email not confirmed"))).toBe(
      true,
    );
    expect(
      isEmailConfirmationRequired(new Error("Invalid login credentials")),
    ).toBe(false);
  });
});

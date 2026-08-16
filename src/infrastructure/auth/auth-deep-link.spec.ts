import { describe, expect, it } from "vitest";

import { parseAuthCallback } from "@/infrastructure/auth/auth-deep-link";

describe("parseAuthCallback", () => {
  it("acepta únicamente el callback de autenticación de Agendivo", () => {
    expect(
      parseAuthCallback("agendivo://auth/callback?code=confirmation-code"),
    ).toEqual({
      accessToken: null,
      code: "confirmation-code",
      error: null,
      isInvitation: false,
      refreshToken: null,
    });
  });

  it("rechaza esquemas y rutas ajenas", () => {
    expect(parseAuthCallback("https://auth/callback?code=stolen")).toBeNull();
    expect(
      parseAuthCallback("agendivo://billing/callback?code=stolen"),
    ).toBeNull();
    expect(parseAuthCallback("valor-inválido")).toBeNull();
  });

  it("lee errores enviados en el fragmento", () => {
    expect(
      parseAuthCallback(
        "agendivo://auth/callback#error_description=Enlace%20vencido",
      ),
    ).toEqual({
      accessToken: null,
      code: null,
      error: "Enlace vencido",
      isInvitation: false,
      refreshToken: null,
    });
  });

  it("reconoce una invitación con sesión en el fragmento", () => {
    expect(
      parseAuthCallback(
        "agendivo://auth/invite#access_token=access&refresh_token=refresh&type=invite",
      ),
    ).toEqual({
      accessToken: "access",
      code: null,
      error: null,
      isInvitation: true,
      refreshToken: "refresh",
    });
  });
});

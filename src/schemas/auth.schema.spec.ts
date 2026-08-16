import { describe, expect, it } from "vitest";

import {
  confirmSignUpSchema,
  registerAccountSchema,
  signInSchema,
} from "@/schemas/auth.schema";

describe("auth schemas", () => {
  it("acepta credenciales válidas para iniciar sesión", () => {
    const result = signInSchema.safeParse({
      email: "persona@ejemplo.com",
      password: "segura123",
    });

    expect(result.success).toBe(true);
  });

  it("rechaza el registro cuando las contraseñas no coinciden", () => {
    const result = registerAccountSchema.safeParse({
      confirmPassword: "diferente123",
      email: "persona@ejemplo.com",
      fullName: "Persona Ejemplo",
      password: "segura123",
    });

    expect(result.success).toBe(false);
  });

  it("rechaza contraseñas menores de ocho caracteres", () => {
    const result = signInSchema.safeParse({
      email: "persona@ejemplo.com",
      password: "corta",
    });

    expect(result.success).toBe(false);
  });

  it("acepta códigos numéricos de confirmación", () => {
    expect(
      confirmSignUpSchema.safeParse({
        email: "persona@ejemplo.com",
        token: "123456",
      }).success,
    ).toBe(true);
    expect(
      confirmSignUpSchema.safeParse({
        email: "persona@ejemplo.com",
        token: "1234AB",
      }).success,
    ).toBe(false);
  });
});

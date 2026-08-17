// src/features/simulation/__tests__/safe-job-error.test.ts
//
// El caso de abajo no es inventado: es el que encontró la revisión de seguridad de aura-engine. Un
// 400 de Pydantic incluye el `input` que falló, y para un campo AUSENTE ese input es el objeto padre
// entero — así que un `llm` sin `enabled` devolvía la API key del usuario dentro del error. De ahí
// iba a `SimulationJob.error`, que es una columna Json en claro.
//
// El motor ya lo arregló. Esto prueba que la app tampoco lo guardaría si volviera a pasar.

import { describe, expect, it } from "vitest";
import { safeJobError } from "@/features/simulation/model/safe-job-error";

const USER_API_KEY = "sk-ant-clave-de-un-usuario-real-0001";

describe("safeJobError", () => {
  it("no deja pasar la clave dentro de un detalle de validación", () => {
    const fromEngine = {
      code: "INVALID_PAYLOAD" as const,
      message: "1 validation error for SimulationRequest",
      details: {
        errors: [
          {
            loc: ["llm", "enabled"],
            type: "missing",
            input: { provider: "anthropic", apiKey: USER_API_KEY },
          },
        ],
      },
    };

    expect(JSON.stringify(safeJobError(fromEngine))).not.toContain(
      USER_API_KEY,
    );
  });

  it("la clave tampoco sobrevive dentro del mensaje", () => {
    const scrubbed = safeJobError({
      code: "ENGINE_FAILURE",
      message: `el proveedor rechazó ${USER_API_KEY}`,
    });

    expect(scrubbed.message).not.toContain(USER_API_KEY);
    // Y lo que sí sirve para depurar se queda.
    expect(scrubbed.message).toContain("el proveedor rechazó");
  });

  it("conserva código, detalle y la ausencia de detalle", () => {
    // Un error sin `details` no puede salir con un objeto vacío: la columna distingue los dos casos.
    expect(safeJobError({ code: "TIMEOUT", message: "sin latido" })).toEqual({
      code: "TIMEOUT",
      message: "sin latido",
      details: undefined,
    });

    expect(
      safeJobError({
        code: "GEOMETRY_INVALID",
        message: "polígono abierto",
        details: { surface: "wall_2", vertices: 3 },
      }),
    ).toEqual({
      code: "GEOMETRY_INVALID",
      message: "polígono abierto",
      details: { surface: "wall_2", vertices: 3 },
    });
  });
});

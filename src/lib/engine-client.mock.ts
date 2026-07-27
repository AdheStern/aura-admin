// src/lib/engine-client.mock.ts — modo mock del motor (Apéndice A.5 del doc maestro)
// ENGINE_MODE=mock resuelve con canon-01.expected.json; ENGINE_MODE=mock-fail simula el camino de error.
// Permite desarrollar y testear las fases de UI sin que exista aura-engine.

import { simulationResultSchema } from "@/contracts";
import canonExpected from "@/contracts/fixtures/canon-01.expected.json";
import type { EngineClient, EngineJobUpdate } from "@/lib/engine-client.types";

const MOCK_RESULT = simulationResultSchema.parse(canonExpected);
const RUNNING_PROGRESS_STEPS = [0, 20, 40, 60, 80, 100] as const;

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function createMockEngineClient(
  mode: "mock" | "mock-fail",
  stepDelayMs = 500,
): EngineClient {
  return {
    async submitSimulation(_request, onUpdate) {
      onUpdate({ status: "QUEUED", progress: 0 });

      for (const progress of RUNNING_PROGRESS_STEPS) {
        await delay(stepDelayMs);
        onUpdate({ status: "RUNNING", progress });
      }

      if (mode === "mock-fail") {
        const update: EngineJobUpdate = {
          status: "FAILED",
          progress: 100,
          error: {
            code: "ENGINE_FAILURE",
            message: "Fallo simulado (ENGINE_MODE=mock-fail)",
          },
        };
        onUpdate(update);
        return;
      }

      onUpdate({ status: "COMPLETED", progress: 100, result: MOCK_RESULT });
    },
  };
}

// src/features/simulation/queries/is-simulation-outdated.ts — ¿esto sigue describiendo la escena?
//
// La §08 pide marcar los resultados como desactualizados cuando la escena cambia, y no borrarlos
// nunca. Comparar el requestHash guardado con el de la escena de hoy responde exactamente eso, y
// además responde bien: detecta que movieron un parlante o cambiaron un material, y NO se dispara
// por renombrar la escena ni por volver a simular lo mismo.
//
// Los ids que se le pasan al compilador dan igual porque requestHash los excluye a propósito: son
// distintos en cada corrida y con ellos dentro el hash nunca coincidiría consigo mismo.

import type { SceneWithRole } from "@/features/scenes/queries";
import { requestHash } from "@/features/simulation/model/request-hash";
import { compileSceneRequest } from "@/features/simulation/queries/compile-scene-request";

const IGNORED_IDS = { jobId: "hash-only", simulationId: "hash-only" };

export type OutdatedCheck = "current" | "outdated" | "unknown";

export async function isSimulationOutdated(
  scene: SceneWithRole,
  storedHash: string,
): Promise<OutdatedCheck> {
  const compiled = await compileSceneRequest(scene, IGNORED_IDS);

  // Una escena que hoy ni siquiera compila (le borraron un material, rompieron el grafo) cambió
  // seguro, pero no se puede afirmar en qué: decir "desactualizado" sería tan falso como decir
  // "vigente", y la UI tiene un tercer texto para eso.
  if (!compiled.ok) return "unknown";

  return requestHash(compiled.request) === storedHash ? "current" : "outdated";
}

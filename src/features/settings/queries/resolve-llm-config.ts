// src/features/settings/queries/resolve-llm-config.ts — el bloque `llm` del payload, o nada.
//
// Es el ÚNICO sitio donde la clave vuelve a estar en claro, y solo para meterla en la petición que
// sale hacia el motor. No se persiste en `Simulation.request` ni entra en el `requestHash`: la
// primera columna es texto plano en la BD y el segundo se compara con la escena de hoy para decidir
// si los resultados están desactualizados — meter la clave ahí guardaría un secreto en claro y haría
// que cambiarla invalidara resultados que siguen siendo válidos.
//
// Sin clave no hay bloque `llm` y el motor redacta con sus plantillas deterministas. Eso no es un
// fallo: las cifras y la acción de cada recomendación son las mismas, solo cambia el texto (ADR-05).

import type { SimulationRequest } from "@/contracts";
import type { LlmProvider } from "@/features/settings/schemas";
import { decryptSecret } from "@/lib/crypto";
import { db } from "@/lib/db";

export async function resolveLlmConfig(
  userId: string,
): Promise<SimulationRequest["llm"]> {
  const settings = await db.userSettings.findUnique({
    where: { userId },
    select: { llmProvider: true, llmApiKeyCipher: true },
  });
  if (!settings?.llmProvider || !settings.llmApiKeyCipher) return undefined;

  // Una clave que ya no descifra (rotó APP_ENCRYPTION_KEY, o alguien tocó la fila) se trata como
  // ausente: mandar basura al proveedor gastaría el presupuesto del job para acabar en plantillas.
  const apiKey = decryptSecret(settings.llmApiKeyCipher);
  if (!apiKey) return undefined;

  return {
    provider: settings.llmProvider as LlmProvider,
    apiKey,
    enabled: true,
  };
}

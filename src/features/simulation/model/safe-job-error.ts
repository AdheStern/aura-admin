// src/features/simulation/model/safe-job-error.ts — limpia el error del motor antes de guardarlo.
//
// `SimulationJob.error` es una columna Json EN CLARO, y su contenido lo elige el motor: el campo
// `details` del envelope es `unknown` y viaja tal cual desde el otro lado de la frontera HTTP. Si
// ahí llegara un secreto, quedaría escrito en Postgres sin cifrar — justo lo que el AES-256-GCM de
// `UserSettings` existe para impedir.
//
// No es una hipótesis: la revisión de seguridad de aura-engine encontró que un 400 de Pydantic
// incluye el `input` que falló, y para un campo ausente ese input es el objeto padre entero — un
// `llm` incompleto devolvía la API key del usuario en claro. El motor ya lo arregló en su lado.
//
// Esto se queda igualmente, y esa es la idea: la app no puede comprobar qué manda el motor, así que
// no lo da por bueno. Un filtro en el punto donde el dato ENTRA a la base cuesta una llamada y no
// depende de que la otra mitad siga estando bien mañana.

import type { JobError } from "@/lib/engine-client.types";
import { scrubSecrets } from "@/lib/scrub-secrets";

export function safeJobError(error: JobError): JobError {
  return {
    code: error.code,
    message: String(scrubSecrets(error.message)),
    // `undefined` y no un objeto vacío: la columna distingue "no vino detalle" de "vino vacío".
    details:
      error.details === undefined ? undefined : scrubSecrets(error.details),
  };
}

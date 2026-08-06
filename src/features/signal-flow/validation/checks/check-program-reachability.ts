// src/features/signal-flow/validation/checks/check-program-reachability.ts — qué suena por cada caja.
//
// El SimulationRequest lleva programSpectrum por parlante, y ese valor se resuelve siguiendo la
// cadena hacia atrás hasta las fuentes que lo alimentan (tarea 3). Si ninguna fuente alcanza una
// caja, no hay programa que resolver: la caja está cableada pero no reproduce nada.
//
// Solo se exige a las cajas que llegan a la simulación. Una caja del rack que no participa en el
// recinto ya tiene su propio aviso; pedirle además programa sería un segundo regaño por lo mismo.

import {
  type GraphIndex,
  isReachable,
  nodesOfKind,
} from "@/features/signal-flow/model/graph-index";
import { simulatedSpeakers } from "@/features/signal-flow/model/simulated-speakers";
import {
  type FlowIssue,
  flowIssue,
} from "@/features/signal-flow/validation/issue-codes";

export function checkProgramReachability(index: GraphIndex): FlowIssue[] {
  const simulated = simulatedSpeakers(index);
  if (simulated.length === 0) return [];

  const sources = nodesOfKind(index, "source");
  if (sources.length === 0) {
    return [
      flowIssue(
        "SPEAKER_WITHOUT_PROGRAM",
        "El sistema no tiene ninguna fuente: no hay programa que reproducir.",
      ),
    ];
  }

  return simulated
    .filter(
      (speaker) =>
        !sources.some((source) => isReachable(index, source.id, speaker.id)),
    )
    .map((speaker) =>
      flowIssue(
        "SPEAKER_WITHOUT_PROGRAM",
        "Ninguna fuente llega a esta caja: sonaría en silencio.",
        { nodeId: speaker.id },
      ),
    );
}

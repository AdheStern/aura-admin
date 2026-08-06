// src/features/signal-flow/model/simulated-speakers.ts — las cajas que suenan en el recinto.
//
// Un parlante cableado no es lo mismo que un parlante simulado: el que está en el rack pero sin
// arista al nodo simulation existe en el sistema y no aporta nada al campo sonoro (el validador lo
// avisa con SPEAKER_NOT_SIMULATED, sin bloquear). Esta distinción la comparten el check de programa
// y la resolución eléctrica —que es quien produce el array `sources` del SimulationRequest—, así
// que vive en un solo sitio: si divergieran, el motor recibiría cajas que la UI no considera parte
// de la simulación, o al revés.

import {
  edgesOutOfPort,
  type GraphIndex,
  nodesOfKind,
} from "@/features/signal-flow/model/graph-index";
import type { ResolvedNode } from "@/features/signal-flow/model/resolved-flow";
import { NAMED_PORT_IDS } from "@/features/signal-flow/schemas/port-ids";

export function simulatedSpeakers(
  index: GraphIndex,
): Extract<ResolvedNode, { kind: "speaker" }>[] {
  return nodesOfKind(index, "speaker").filter(
    (speaker) =>
      edgesOutOfPort(index, speaker.id, NAMED_PORT_IDS.speakerToSimulation)
        .length > 0,
  );
}

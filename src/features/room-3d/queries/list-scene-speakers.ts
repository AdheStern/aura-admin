// src/features/room-3d/queries/list-scene-speakers.ts — las cajas que el editor 3D instancia.
//
// Son las del GRAFO, no las del recinto: §5.3 es explícita en que aquí no se pueden crear parlantes
// porque la fuente de verdad es el flujo. Y son las SIMULADAS, reusando simulatedSpeakers() en vez
// de filtrar por nuestra cuenta — su cabecera pide justo eso, que la regla viva en un sitio, o el
// 3D acabaría mostrando cajas que la resolución eléctrica no manda al motor.

import type { SpeakerSpec } from "@/contracts/speaker-spec.schema";
import { buildGraphIndex } from "@/features/signal-flow/model/graph-index";
import { hydrateFlow } from "@/features/signal-flow/model/resolved-flow";
import { simulatedSpeakers } from "@/features/signal-flow/model/simulated-speakers";
import { CATALOG_LOADERS } from "@/features/signal-flow/queries/catalog-loaders";
import { resolveFlowCatalog } from "@/features/signal-flow/queries/resolve-flow-catalog";
import type { SpeakerAudio } from "@/features/signal-flow/schemas/node-data";
import {
  parseSignalFlow,
  type SignalFlowDocument,
} from "@/features/signal-flow/schemas/signal-flow";

export type SceneSpeaker = {
  /** Id del nodo del grafo: la clave con la que el recinto guarda su colocación. */
  nodeId: string;
  /** "JBL PRX418S", o un texto de relleno si el nodo todavía no tiene ítem elegido. */
  label: string;
  /** null si el nodo no tiene ítem, la fila ya no está o su specVersion no se soporta. */
  spec: SpeakerSpec | null;
  audio: SpeakerAudio;
};

const UNNAMED_SPEAKER = "Parlante sin equipo";

export async function listSceneSpeakers(
  rawSignalFlow: unknown,
): Promise<SceneSpeaker[]> {
  const parsed = parseSignalFlow(rawSignalFlow);
  // Un flujo ilegible no es asunto de esta pantalla: la del editor de flujo lo corta con notFound.
  if (!parsed.ok) return [];

  const [snapshot, rows] = await Promise.all([
    resolveFlowCatalog(parsed.data),
    CATALOG_LOADERS.speaker.findMany(referencedSpeakerIds(parsed.data)),
  ]);
  const labelById = new Map(rows.map((row) => [row.id, row.label]));
  const index = buildGraphIndex(hydrateFlow(parsed.data, snapshot));

  return simulatedSpeakers(index).map((speaker) => ({
    nodeId: speaker.id,
    label:
      (speaker.data.catalogItemId
        ? labelById.get(speaker.data.catalogItemId)
        : null) ?? UNNAMED_SPEAKER,
    spec: speaker.spec,
    audio: {
      levelDb: speaker.data.levelDb,
      polarityInverted: speaker.data.polarityInverted,
      delayMs: speaker.data.delayMs,
    },
  }));
}

function referencedSpeakerIds(document: SignalFlowDocument): string[] {
  const ids = new Set<string>();
  for (const node of document.nodes) {
    if (node.data.kind === "speaker" && node.data.catalogItemId) {
      ids.add(node.data.catalogItemId);
    }
  }
  return [...ids];
}

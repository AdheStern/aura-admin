// src/features/simulation/model/scene-instruments.ts — los instrumentos de una escena.
//
// Existe porque el motor NO los conoce. Sus `sources` del payload son CAJAS acústicas (llevan
// speakerSpec); del grafo mic→consola→PA solo cruzan dos escalares ya resueltos, `electricalPowerW`
// y la etiqueta `programSpectrum`. Buscar aquí una regla del motor que reaprovechar sería perder
// el tiempo: ninguna de las siete puede hablar por instrumento, y por eso el asesor de mezcla es
// el único sitio donde ese consejo puede existir.
//
// Se lee del grafo de HOY y no del `SimulationRequest` congelado —al revés que resolve-source-names,
// que sí lo lee— porque el flujo de señal nunca estuvo en el request: no hay versión congelada que
// consultar. LIMITACIÓN que eso deja: un consejo guardado puede nombrar un instrumento que alguien
// quitó después del grafo. El aviso de resultados desactualizados cubre el caso, y regenerar lo
// corrige.
//
// Un nodo sin ítem de catálogo elegido no es un instrumento todavía, así que no viaja: pedirle
// consejo a la IA sobre "fuente sin elegir" gastaría tokens en nada.

import { sourceSpecSchema } from "@/contracts";
import type { SourceOutputMode } from "@/features/signal-flow/schemas/node-data";
import type { SignalFlowDocument } from "@/features/signal-flow/schemas/signal-flow";

export type SourceNode = {
  nodeId: string;
  catalogItemId: string;
  outputMode: SourceOutputMode;
};

export type CatalogSourceRow = {
  id: string;
  name: string;
  category: string;
  spec: unknown;
};

/** Lo que se le manda a la IA por instrumento. Nada que no salga del catálogo o del grafo. */
export type SceneInstrument = {
  /** El id del NODO, no el del catálogo: dos teclados iguales son dos canales distintos. */
  nodeId: string;
  name: string;
  category: string;
  outputMode: SourceOutputMode;
  fundamentalRangeHz: [number, number] | null;
  harmonics: string | null;
  /** Si llega al sistema por amplificador propio o al aire, que cambia todo el criterio de mezcla. */
  amplified: boolean | null;
  acousticPower: string | null;
};

export function sourceNodesOf(document: SignalFlowDocument): SourceNode[] {
  return document.nodes.flatMap((node) =>
    node.data.kind === "source" && node.data.catalogItemId
      ? [
          {
            nodeId: node.id,
            catalogItemId: node.data.catalogItemId,
            outputMode: node.data.outputMode,
          },
        ]
      : [],
  );
}

export function describeInstruments(
  nodes: readonly SourceNode[],
  rows: readonly CatalogSourceRow[],
): SceneInstrument[] {
  const byId = new Map(rows.map((row) => [row.id, row]));

  return nodes.flatMap((node) => {
    const row = byId.get(node.catalogItemId);
    if (!row) return [];

    const spec = sourceSpecSchema.safeParse(row.spec);
    return [
      {
        nodeId: node.nodeId,
        name: row.name,
        category: row.category,
        outputMode: node.outputMode,
        fundamentalRangeHz: spec.success ? spec.data.fundamentalRangeHz : null,
        harmonics: spec.success ? spec.data.harmonics : null,
        amplified: spec.success ? spec.data.amplified : null,
        acousticPower: spec.success ? spec.data.acousticPower : null,
      },
    ];
  });
}

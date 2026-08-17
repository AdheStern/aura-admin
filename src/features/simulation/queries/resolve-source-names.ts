// src/features/simulation/queries/resolve-source-names.ts — los nombres de catálogo de las cajas
// que produjeron una simulación.
//
// Sale del `SimulationRequest` CONGELADO y no del grafo de hoy: la recomendación habla de la caja
// que se simuló, y resolverla contra la escena actual señalaría a otro equipo si alguien cambió el
// flujo después. Mismo criterio que resolve-treatment.ts.
//
// El catálogo sí es el de HOY: un modelo renombrado se lee con su nombre nuevo, que es lo que el
// usuario reconoce.

import { simulationRequestSchema } from "@/contracts";
import {
  nameSources,
  type SourceNames,
  speakerIdOf,
} from "@/features/simulation/model/source-names";
import { db } from "@/lib/db";

export async function resolveSourceNames(
  simulationId: string,
): Promise<SourceNames> {
  const simulation = await db.simulation.findUnique({
    where: { id: simulationId },
    select: { request: true },
  });
  const request = simulationRequestSchema.safeParse(simulation?.request);
  if (!request.success) return new Map();

  const sources = request.data.sources;
  const speakerIds = [
    ...new Set(
      sources
        .map((source) => speakerIdOf(source.catalogRef))
        .filter((id): id is string => id !== null),
    ),
  ];
  if (speakerIds.length === 0) return new Map();

  const rows = await db.catalogSpeaker.findMany({
    where: { id: { in: speakerIds } },
    select: { id: true, brand: true, model: true },
  });

  return nameSources(
    sources,
    new Map(rows.map((row) => [row.id, `${row.brand} ${row.model}`])),
  );
}

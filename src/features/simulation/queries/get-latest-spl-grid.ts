// src/features/simulation/queries/get-latest-spl-grid.ts — la cobertura vigente de una escena.
//
// Solo de simulaciones COMPLETED: un job que falló o se canceló no tiene grilla que pintar, y el de
// una escena a medio calcular pintaría un mapa incompleto como si fuera el resultado.
//
// Se devuelve el dBA y no las bandas sueltas: el 3D no tiene sitio para un selector de banda y dBA
// es la ponderación con la que se juzga un nivel. El detalle por banda vive en la vista de
// resultados, que sí lo ofrece.

import { z } from "zod";
import { simulationConfigSchema, simulationGridSchema } from "@/contracts";
import { db } from "@/lib/db";

export type SplOverlay = {
  simulationId: string;
  /** [x, y, z] en el marco del contrato, alineado índice a índice con valuesDbA. */
  points: [number, number, number][];
  valuesDbA: number[];
  resolutionM: number;
};

const gridPayloadSchema = z.looseObject({ spl: simulationGridSchema });

export async function getLatestSplGrid(
  sceneId: string,
): Promise<SplOverlay | null> {
  const simulation = await db.simulation.findFirst({
    where: { sceneId, job: { status: "COMPLETED" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      config: true,
      results: { where: { kind: "SPL_GRID" }, select: { payload: true } },
    },
  });
  if (!simulation) return null;

  const payload = gridPayloadSchema.safeParse(simulation.results[0]?.payload);
  const config = simulationConfigSchema.safeParse(simulation.config);
  if (!payload.success || !config.success) return null;

  const { points, valuesDbA } = payload.data.spl;
  // Sin dBA no hay mapa: es el único array que este overlay sabe pintar.
  if (!valuesDbA) return null;

  return {
    simulationId: simulation.id,
    points: points as [number, number, number][],
    valuesDbA,
    resolutionM: config.data.grid.resolutionM,
  };
}

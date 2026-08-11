// src/features/simulation/queries/resolve-scene-materials.ts — el diccionario `materials` del
// payload: cada materialId que la geometría cita, resuelto a su MaterialSpec completo (ADR-03).
//
// Pide solo los citados y una vez cada uno: una sala con doce paredes del mismo ladrillo trae esa
// fila una sola vez, igual que hace resolveFlowCatalog con los datasheets del grafo.
//
// Una fila con otra specVersion se OMITE en vez de reventar. El que falte lo detecta el llamador
// comparando contra los ids citados — el compilador no puede mandar media verdad al motor.

import {
  type MaterialSpec,
  materialSpecSchema,
} from "@/contracts/material-spec.schema";
import type { RoomDocument } from "@/features/room-editor/schemas/room-document";
import { db } from "@/lib/db";

export type SceneMaterials = {
  materials: Record<string, MaterialSpec>;
  /** Citados por la geometría que no se pudieron resolver: fila borrada o specVersion no soportada. */
  missingIds: string[];
};

export async function resolveSceneMaterials(
  document: RoomDocument,
): Promise<SceneMaterials> {
  const citedIds = citedMaterialIds(document);
  if (citedIds.length === 0) return { materials: {}, missingIds: [] };

  const rows = await db.catalogMaterial.findMany({
    where: { id: { in: citedIds } },
    select: { id: true, spec: true, specVersion: true },
  });

  const materials: Record<string, MaterialSpec> = {};
  for (const row of rows) {
    if (row.specVersion !== "1") continue;
    const parsed = materialSpecSchema.safeParse(row.spec);
    if (parsed.success) materials[row.id] = parsed.data;
  }

  return {
    materials,
    missingIds: citedIds.filter((id) => !(id in materials)),
  };
}

/** Superficies, pilares y aberturas: los tres llevan materialId en el contrato. */
export function citedMaterialIds(document: RoomDocument): string[] {
  const ids = new Set<string>();

  for (const entity of [
    ...document.surfaces,
    ...document.obstacles,
    ...document.openings,
  ]) {
    if (entity.materialId) ids.add(entity.materialId);
  }
  return [...ids];
}

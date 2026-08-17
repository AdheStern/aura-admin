// src/features/room-editor/queries/list-room-material-specs.ts — la ficha completa de cada material
// del catálogo, para lo que los editores necesitan enseñar del material elegido: su curva de
// absorción por banda en el panel de propiedades y el código de color por NRC de las mallas 3D.
//
// Consulta aparte de list-room-material-options.ts a propósito: aquella la usan también save-room y
// apply-recommendation, que solo necesitan el conjunto de ids para validar. Parsear cuarenta specs
// en cada autosave sería trabajo tirado.

import {
  type MaterialSpec,
  materialSpecSchema,
} from "@/contracts/material-spec.schema";
import { db } from "@/lib/db";

export type MaterialSpecById = ReadonlyMap<string, MaterialSpec>;

export async function listRoomMaterialSpecs(): Promise<MaterialSpecById> {
  const rows = await db.catalogMaterial.findMany({
    select: { id: true, spec: true, specVersion: true },
  });

  // Un spec de otra versión o que no valida se OMITE en vez de romper el editor: el efecto es que
  // ese material se ve "sin ficha" (gris, sin curva), no que la sala entera deje de abrirse.
  const entries = rows.flatMap((row): [string, MaterialSpec][] => {
    if (row.specVersion !== "1") return [];
    const parsed = materialSpecSchema.safeParse(row.spec);
    return parsed.success ? [[row.id, parsed.data]] : [];
  });

  return new Map(entries);
}

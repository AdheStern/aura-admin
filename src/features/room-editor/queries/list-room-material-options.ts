// src/features/room-editor/queries/list-room-material-options.ts — el catálogo de materiales para
// el editor 2D: las opciones del picker y el conjunto de ids que validateRoom necesita para decidir
// MATERIAL_MISSING. Un solo catálogo (a diferencia de list-flow-catalog-library.ts, que junta
// cinco), así que no hace falta el mapa kind→loader de aquel.

import { db } from "@/lib/db";

export type MaterialPickerOption = {
  id: string;
  label: string;
  category: string;
};

export type RoomMaterialLibrary = {
  options: MaterialPickerOption[];
  materialIds: ReadonlySet<string>;
};

export async function listRoomMaterialOptions(): Promise<RoomMaterialLibrary> {
  const rows = await db.catalogMaterial.findMany({
    select: { id: true, name: true, category: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return {
    options: rows.map((row) => ({
      id: row.id,
      label: row.name,
      category: row.category,
    })),
    materialIds: new Set(rows.map((row) => row.id)),
  };
}

// src/features/room-3d/queries/list-room-material-colors.ts — el NRC de cada material del
// catálogo, para pintar las mallas del editor 3D (§5.3: "código de color por NRC"). Consulta propia
// y no una extensión de list-room-material-options.ts porque el combobox 2D no necesita coeficientes
// — solo el 3D los usa, y solo para color, nunca para calcular nada.

import { materialSpecSchema } from "@/contracts/material-spec.schema";
import { deriveNrc } from "@/features/room-3d/model/nrc-color";
import { db } from "@/lib/db";

export type MaterialNrcById = ReadonlyMap<string, number>;

export async function listRoomMaterialColors(): Promise<MaterialNrcById> {
  const rows = await db.catalogMaterial.findMany({
    select: { id: true, spec: true, specVersion: true },
  });

  const entries = rows.flatMap((row): [string, number][] => {
    if (row.specVersion !== "1") return [];
    const parsed = materialSpecSchema.safeParse(row.spec);
    return parsed.success ? [[row.id, deriveNrc(parsed.data)]] : [];
  });

  return new Map(entries);
}

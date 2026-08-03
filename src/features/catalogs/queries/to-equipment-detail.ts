// src/features/catalogs/queries/to-equipment-detail.ts — fila de BD → detalle tipado.
// El spec se valida al leer, no solo al escribir: una fila guardada con un contrato anterior
// (specVersion distinta) devuelve spec: null y la UI ofrece corregirla, en vez de romperse.

import type { z } from "zod";
import type { CatalogEquipmentDetail } from "@/features/catalogs/types";

type EquipmentRow = {
  id: string;
  brand: string;
  model: string;
  category: string;
  spec: unknown;
  specVersion: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function toEquipmentDetail<T>(
  row: EquipmentRow,
  schema: z.ZodType<T>,
): CatalogEquipmentDetail<T> {
  const parsed = row.specVersion === "1" ? schema.safeParse(row.spec) : null;

  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    category: row.category,
    verified: row.verified,
    specVersion: row.specVersion,
    spec: parsed?.success ? parsed.data : null,
    specRaw: row.spec,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

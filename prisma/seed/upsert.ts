// prisma/seed/upsert.ts — validación e idempotencia del seed.
// Regla (1) de ingesta del doc: todo JSON se valida con zod antes del INSERT. Aquí se valida
// además de tiparse en compilación, porque las reglas de derivación calculan valores en runtime
// y un redondeo fuera de rango debe romper el seed, no colarse a la BD.

import type { Prisma, PrismaClient } from "@prisma/client";
import type { z } from "zod";
import type { MaterialSpec } from "../../src/contracts/material-spec.schema";

export type EquipmentEntry<T> = { brand: string; model: string; spec: T };

export type EquipmentRecord = {
  brand: string;
  model: string;
  category: string;
  spec: Prisma.InputJsonValue;
  specVersion: string;
  verified: boolean;
};

function fail(label: string, item: string, error: z.ZodError): never {
  const issue = error.issues[0];
  const path = issue?.path.join(".");
  throw new Error(
    `${label} · "${item}" no cumple su contrato → ${path ? `${path}: ` : ""}${issue?.message}`,
  );
}

/**
 * Valida cada spec y arma la fila. `category` y `specVersion` se derivan SIEMPRE del spec ya
 * validado, nunca se escriben aparte: es la regla que impide que la columna plana divergja del
 * JSONB, que es la fuente de verdad del datasheet.
 */
export function toEquipmentRecords<
  T extends { kind: string; schemaVersion: string },
>(
  label: string,
  entries: EquipmentEntry<T>[],
  schema: z.ZodType<T>,
): EquipmentRecord[] {
  return entries.map((entry) => {
    const parsed = schema.safeParse(entry.spec);
    if (!parsed.success) {
      fail(label, `${entry.brand} ${entry.model}`, parsed.error);
    }
    return {
      brand: entry.brand,
      model: entry.model,
      category: parsed.data.kind,
      spec: parsed.data as Prisma.InputJsonValue,
      specVersion: parsed.data.schemaVersion,
      // El seed nunca marca verificado: la revisión humana es un paso posterior explícito
      // (regla 4 de ingesta y "+ revisión humana" en el roadmap de Fase 1).
      verified: false,
    };
  });
}

export async function upsertAll(
  label: string,
  records: EquipmentRecord[],
  upsertOne: (record: EquipmentRecord) => Promise<unknown>,
): Promise<void> {
  for (const record of records) {
    await upsertOne(record);
  }
  console.log(`✓ ${records.length} ${label}`);
}

/**
 * Materiales aparte: catalog_material no tiene @@unique (dos materiales pueden compartir `name`
 * con procedencias distintas, decisión del modelo), así que no hay clave para un upsert de Prisma.
 * Se resuelve leyendo los nombres existentes de una vez y decidiendo update o create por nombre.
 * Implica que el seed es dueño de los nombres que inserta: si alguien crea a mano un material que
 * se llame igual que uno del seed, la siguiente pasada lo sobrescribe.
 */
export async function upsertMaterials(
  prisma: PrismaClient,
  schema: z.ZodType<MaterialSpec>,
  specs: MaterialSpec[],
): Promise<void> {
  const existing = await prisma.catalogMaterial.findMany({
    select: { id: true, name: true },
  });
  const idByName = new Map(existing.map((row) => [row.name, row.id]));

  for (const spec of specs) {
    const parsed = schema.safeParse(spec);
    if (!parsed.success) {
      fail("Materiales", spec.name ?? "(sin nombre)", parsed.error);
    }

    const data = {
      name: parsed.data.name,
      category: parsed.data.category,
      spec: parsed.data as Prisma.InputJsonValue,
      specVersion: parsed.data.schemaVersion,
      verified: false,
    };

    const id = idByName.get(parsed.data.name);
    if (id) {
      await prisma.catalogMaterial.update({ where: { id }, data });
    } else {
      await prisma.catalogMaterial.create({ data });
    }
  }
  console.log(`✓ ${specs.length} materiales`);
}

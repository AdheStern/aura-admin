// src/features/signal-flow/queries/catalog-loaders.ts — el único mapa kind→tabla de catálogo.
// Lo comparten resolve-flow-catalog.ts (trae solo lo referenciado, para revalidar al guardar) y
// list-flow-catalog-library.ts (trae todo, para el picker y la hidratación inicial del editor):
// mismo contrato de validación, así que un catálogo nuevo se da de alta aquí una sola vez.

import type { z } from "zod";
import { amplifierSpecSchema } from "@/contracts/amplifier-spec.schema";
import { consoleSpecSchema } from "@/contracts/console-spec.schema";
import { microphoneSpecSchema } from "@/contracts/microphone-spec.schema";
import { sourceSpecSchema } from "@/contracts/source-spec.schema";
import { speakerSpecSchema } from "@/contracts/speaker-spec.schema";
import type { FlowNodeKind } from "@/features/signal-flow/schemas/node-kinds";
import { db } from "@/lib/db";

export type CatalogRow = {
  id: string;
  spec: unknown;
  specVersion: string;
  /** Marca+modelo en los cuatro catálogos de equipo; el nombre propio en `source`. */
  label: string;
};

type Loader = {
  schema: z.ZodType;
  findMany: (ids?: string[]) => Promise<CatalogRow[]>;
};

const SELECT_LABELED = {
  id: true,
  spec: true,
  specVersion: true,
  brand: true,
  model: true,
} as const;

const SELECT_NAMED = {
  id: true,
  spec: true,
  specVersion: true,
  name: true,
} as const;

function withLabel<T extends { brand: string; model: string }>(rows: T[]) {
  return rows.map((row) => ({ ...row, label: `${row.brand} ${row.model}` }));
}

function withName<T extends { name: string }>(rows: T[]) {
  return rows.map((row) => ({ ...row, label: row.name }));
}

function whereIds(ids?: string[]) {
  return ids ? { id: { in: ids } } : undefined;
}

/** Los cinco catálogos que alimentan nodos del flujo, con el contrato que valida su spec. */
export const CATALOG_LOADERS = {
  source: {
    schema: sourceSpecSchema,
    findMany: async (ids?: string[]) =>
      withName(
        await db.catalogSource.findMany({
          where: whereIds(ids),
          select: SELECT_NAMED,
        }),
      ),
  },
  microphone: {
    schema: microphoneSpecSchema,
    findMany: async (ids?: string[]) =>
      withLabel(
        await db.catalogMicrophone.findMany({
          where: whereIds(ids),
          select: SELECT_LABELED,
        }),
      ),
  },
  console: {
    schema: consoleSpecSchema,
    findMany: async (ids?: string[]) =>
      withLabel(
        await db.catalogConsole.findMany({
          where: whereIds(ids),
          select: SELECT_LABELED,
        }),
      ),
  },
  pa: {
    schema: amplifierSpecSchema,
    findMany: async (ids?: string[]) =>
      withLabel(
        await db.catalogAmplifier.findMany({
          where: whereIds(ids),
          select: SELECT_LABELED,
        }),
      ),
  },
  speaker: {
    schema: speakerSpecSchema,
    findMany: async (ids?: string[]) =>
      withLabel(
        await db.catalogSpeaker.findMany({
          where: whereIds(ids),
          select: SELECT_LABELED,
        }),
      ),
  },
} as const satisfies Record<Exclude<FlowNodeKind, "simulation">, Loader>;

export type CatalogKind = keyof typeof CATALOG_LOADERS;

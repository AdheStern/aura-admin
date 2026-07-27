// src/contracts/registry.ts — inventario de contratos v1 y su archivo .schema.json canónico.
// Un único lugar que enumera los contratos: lo consumen el generador y el test de drift, así
// que añadir un contrato sin su JSON Schema (o al revés) rompe el build, nunca pasa callado.

import { z } from "zod";
import { materialSpecSchema } from "./material-spec.schema";
import { roomGeometrySchema } from "./room-geometry.schema";
import { simulationRequestSchema } from "./simulation-request.schema";
import {
  engineErrorEnvelopeSchema,
  simulationResultSchema,
} from "./simulation-result.schema";
import { speakerSpecSchema } from "./speaker-spec.schema";

/** Versión de los contratos. Cambiarla es el paso (1) del procedimiento de la Sección 07. */
export const CONTRACTS_SCHEMA_VERSION = "1" as const;

export interface ContractDefinition {
  /** Nombre del archivo, idéntico en aura-admin/src/contracts y aura-engine/contracts. */
  fileName: string;
  /** URN estable: sobrevive a la copia entre repos, no depende de ninguna URL publicada. */
  id: string;
  schema: z.ZodType;
}

export const CONTRACTS: readonly ContractDefinition[] = [
  {
    fileName: "speaker-spec.schema.json",
    id: "urn:aura:contracts:v1:speaker-spec",
    schema: speakerSpecSchema,
  },
  {
    fileName: "material-spec.schema.json",
    id: "urn:aura:contracts:v1:material-spec",
    schema: materialSpecSchema,
  },
  {
    fileName: "room-geometry.schema.json",
    id: "urn:aura:contracts:v1:room-geometry",
    schema: roomGeometrySchema,
  },
  {
    fileName: "simulation-request.schema.json",
    id: "urn:aura:contracts:v1:simulation-request",
    schema: simulationRequestSchema,
  },
  {
    fileName: "simulation-result.schema.json",
    id: "urn:aura:contracts:v1:simulation-result",
    schema: simulationResultSchema,
  },
  {
    fileName: "engine-error.schema.json",
    id: "urn:aura:contracts:v1:engine-error",
    schema: engineErrorEnvelopeSchema,
  },
] as const;

/**
 * Convierte un contrato zod al JSON Schema canónico que se copia a aura-engine.
 * Debe ser determinista: el test de drift compara su salida contra el archivo versionado.
 */
export function toContractJsonSchema(
  contract: ContractDefinition,
): Record<string, unknown> {
  const { $schema, ...body } = z.toJSONSchema(contract.schema, {
    target: "draft-2020-12",
    io: "input",
  }) as Record<string, unknown>;

  return { $schema, $id: contract.id, ...body };
}

// src/features/simulation/model/request-hash.ts — huella del payload para caché y deduplicación.
//
// jobId y simulationId quedan FUERA: cambian en cada corrida, y con ellos dentro el hash sería
// distinto siempre y nunca deduplicaría nada, que es justo su único propósito.
//
// Las claves se ordenan antes de serializar. Lo contrario haría depender la huella del orden en
// que el compilador rellenó los objetos, y dos payloads idénticos darían hashes distintos.

import { createHash } from "node:crypto";
import type { SimulationRequest } from "@/contracts";

export function requestHash(request: SimulationRequest): string {
  const { jobId: _jobId, simulationId: _simulationId, ...identity } = request;
  return createHash("sha256").update(canonicalJson(identity)).digest("hex");
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    // Los arrays NO se ordenan: en `sources` el orden es significativo (lo comparten las
    // colocaciones), y en las grillas alinea índice a índice.
    return value.map(sortKeys);
  }
  if (value === null || typeof value !== "object") {
    return value;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  entries.sort(([left], [right]) => (left < right ? -1 : 1));
  return Object.fromEntries(
    entries.map(([key, item]) => [key, sortKeys(item)]),
  );
}

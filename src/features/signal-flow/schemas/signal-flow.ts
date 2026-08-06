// src/features/signal-flow/schemas/signal-flow.ts — el documento que se serializa a
// Scene.signalFlow (Sección 4.1). Contrato interno de la app: nunca cruza al motor, que solo
// recibe los dos escalares derivados del grafo (electricalPowerW y programSpectrum).
//
// Estricto a propósito. No es paranoia: un campo inesperado significa casi siempre que se guardó
// un nodo de React Flow crudo —con selected, dragging, measured, width…— en vez del documento.
// Ese error es invisible hasta que el grafo pesa de más y la validación mira campos que no existen,
// así que se corta en el parseo. El mapeo a/desde React Flow es trabajo del editor, no del modelo.

import { z } from "zod";
import { flowNodeDataSchema } from "@/features/signal-flow/schemas/node-data";

export const flowNodeSchema = z.strictObject({
  id: z.string().min(1),
  position: z.strictObject({ x: z.number(), y: z.number() }),
  data: flowNodeDataSchema,
});

export const flowEdgeSchema = z.strictObject({
  id: z.string().min(1),
  source: z.string().min(1),
  sourceHandle: z.string().min(1),
  target: z.string().min(1),
  targetHandle: z.string().min(1),
});

export const signalFlowDocumentSchema = z.strictObject({
  schemaVersion: z.literal("1"),
  nodes: z.array(flowNodeSchema),
  edges: z.array(flowEdgeSchema),
  viewport: z.strictObject({
    x: z.number(),
    y: z.number(),
    zoom: z.number().positive(),
  }),
});

export type FlowNode = z.infer<typeof flowNodeSchema>;
export type FlowEdge = z.infer<typeof flowEdgeSchema>;
export type SignalFlowDocument = z.infer<typeof signalFlowDocumentSchema>;

export const DEFAULT_SIMULATION_NODE_ID = "simulation";

// La escena nace con el nodo simulation puesto: es el sumidero del sistema, no un aparato que el
// usuario deba adivinar que hay que añadir. Así SIMULATION_NODE_MISSING solo aparece si lo borró.
export const EMPTY_SIGNAL_FLOW: SignalFlowDocument = {
  schemaVersion: "1",
  nodes: [
    {
      id: DEFAULT_SIMULATION_NODE_ID,
      position: { x: 720, y: 200 },
      data: { kind: "simulation" },
    },
  ],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
};

export type ParseSignalFlowResult =
  | { ok: true; data: SignalFlowDocument }
  | { ok: false; message: string };

/**
 * Lee la columna JSONB. Prisma la crea con `{}` (@default), que no es un documento válido sino una
 * escena recién creada: se traduce al documento vacío en vez de reportar un error que no lo es.
 */
export function parseSignalFlow(raw: unknown): ParseSignalFlowResult {
  if (isEmptyJsonObject(raw)) return { ok: true, data: EMPTY_SIGNAL_FLOW };

  const parsed = signalFlowDocumentSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join(".");
    return {
      ok: false,
      message: path
        ? `${path}: ${issue.message}`
        : (issue?.message ?? "Flujo de señal inválido"),
    };
  }
  return { ok: true, data: parsed.data };
}

function isEmptyJsonObject(raw: unknown): boolean {
  return (
    typeof raw === "object" &&
    raw !== null &&
    !Array.isArray(raw) &&
    Object.keys(raw).length === 0
  );
}

// src/features/signal-flow/schemas/node-kinds.ts — los seis tipos de nodo del flujo de señal
// (Sección 5.1 del doc maestro). Clave de todo lo demás: el registro, los puertos y la data.

import { z } from "zod";

export const flowNodeKindSchema = z.enum([
  "source",
  "microphone",
  "console",
  "pa",
  "speaker",
  "simulation",
]);

export type FlowNodeKind = z.infer<typeof flowNodeKindSchema>;

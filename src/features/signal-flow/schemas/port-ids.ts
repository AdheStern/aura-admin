// src/features/signal-flow/schemas/port-ids.ts — convención de ids de handle del grafo.
//
// Vive con los schemas y no con el modelo porque las aristas guardadas en Scene.signalFlow
// referencian estas cadenas: cambiar el formato rompe grafos ya persistidos, no solo el dibujo.
//
// El índice de "in-3"/"out-3" ES el canal del aparato (0-based). De ahí lo saca la resolución
// eléctrica de la tarea 3 para cruzarlo con powerPerChannelW, así que no es decorativo.

/** Puertos con nombre: los que no numeran canales porque el aparato solo tiene uno de su clase. */
export const NAMED_PORT_IDS = {
  /** Salida al aire de una fuente: lo que capta un micrófono. */
  sourceAcoustic: "acoustic",
  /** Salida de línea de una fuente (DI o pastilla): va directa a consola/procesador. */
  sourceDirect: "di",
  // Canal derecho de una fuente estéreo. El izquierdo reusa `di` en vez de estrenar un `di-l`:
  // así pasar una fuente de mono a estéreo NO invalida el cable que ya estaba puesto, solo añade
  // uno. Al revés (estéreo → mono) el cable de la derecha sí queda colgando, y el validador lo
  // reporta como PORT_OUT_OF_RANGE, que es la verdad: ese conector dejó de existir.
  sourceDirectRight: "di-r",
  /** Entrada única de micrófono y parlante. */
  input: "in",
  /** Salida única de micrófono. */
  output: "out",
  /** Salida de enlace del parlante: encadena otra caja (thru del sub, paralelo de dos pasivas). */
  speakerLink: "link",
  /** Aporte acústico del parlante hacia el nodo simulation. */
  speakerToSimulation: "sim",
} as const;

const INDEXED_PORT_PATTERN = /^(in|out)-(\d+)$/;

export function inputPortId(channelIndex: number): string {
  return `in-${channelIndex}`;
}

export function outputPortId(channelIndex: number): string {
  return `out-${channelIndex}`;
}

/** Índice de canal de un puerto numerado, o null si el puerto tiene nombre (no numera canales). */
export function portChannelIndex(portId: string): number | null {
  const match = INDEXED_PORT_PATTERN.exec(portId);
  return match ? Number(match[2]) : null;
}

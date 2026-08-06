// src/features/signal-flow/rules/connection-rejection.ts — por qué se rechaza una conexión.
// canConnect devuelve un motivo tipado y no un booleano porque el editor lo pinta como aviso al
// soltar la arista: "no se puede" sin decir por qué es exactamente lo que hace que el usuario
// pruebe a repetir la misma conexión.

import {
  type SignalDomain,
  signalDomainLabel,
} from "@/features/signal-flow/model/signal-domain";

export type ConnectionRejection =
  | { code: "SELF_CONNECTION" }
  | { code: "NODE_NOT_FOUND" }
  | { code: "PORT_NOT_FOUND" }
  | { code: "DIRECTION_MISMATCH" }
  | { code: "DOMAIN_MISMATCH"; from: SignalDomain; to: SignalDomain }
  | { code: "DUPLICATE_EDGE" }
  | { code: "PORT_BUSY" }
  | { code: "WOULD_CREATE_CYCLE" };

export type ConnectionRejectionCode = ConnectionRejection["code"];

export function connectionRejectionMessage(
  rejection: ConnectionRejection,
): string {
  switch (rejection.code) {
    case "SELF_CONNECTION":
      return "Un nodo no puede conectarse a sí mismo.";
    case "NODE_NOT_FOUND":
      return "Uno de los nodos ya no existe en el grafo.";
    case "PORT_NOT_FOUND":
      return "Ese conector no existe: revisa el datasheet del equipo, puede haber cambiado.";
    case "DIRECTION_MISMATCH":
      return "Una conexión va siempre de una salida a una entrada.";
    case "DOMAIN_MISMATCH":
      return domainMismatchMessage(rejection.from, rejection.to);
    case "DUPLICATE_EDGE":
      return "Esos dos conectores ya están unidos.";
    case "PORT_BUSY":
      return "Esa entrada ya está ocupada: solo admite una conexión.";
    case "WOULD_CREATE_CYCLE":
      return "La señal volvería sobre sí misma: el grafo no admite lazos.";
  }
}

// Los dos casos que dan el mensaje útil son físicos, no de tipos, y son justo los que la lista
// lineal anterior no distinguía. Se nombran explícitamente en vez de dejar el genérico.
function domainMismatchMessage(from: SignalDomain, to: SignalDomain): string {
  if (from === "speaker_level" && to === "line") {
    return "Salida de potencia sobre una entrada de línea: eso destruye una caja activa. Va a una caja pasiva.";
  }
  if (from === "line" && to === "speaker_level") {
    return "Una salida de línea no entrega vatios: una caja pasiva necesita un amplificador antes.";
  }
  return `Señales incompatibles: ${signalDomainLabel(from)} no alimenta una entrada de ${signalDomainLabel(to)}.`;
}

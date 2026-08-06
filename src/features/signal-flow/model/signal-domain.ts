// src/features/signal-flow/model/signal-domain.ts — dominio de señal de un puerto.
//
// Es el corazón del modelo: en vez de una lista blanca de pares de tipos de nodo (que no sabe
// distinguir un procesador de un amplificador ni una caja activa de una pasiva), cada puerto
// declara QUÉ señal lleva y una conexión vale si —y solo si— los dominios coinciden.
//
// La ganancia no es de estilo. La lista lineal del doc admitía console→pa→speaker y nada más, así
// que no representaba cadenas reales (un dbx alimentando cajas activas) y a la vez NO impedía la
// única conexión que destruye equipo: la salida de potencia de un amplificador enchufada a la
// entrada de línea de una caja activa. Con dominios, ambas cosas salen solas de la tabla.

export const SIGNAL_DOMAINS = [
  /** Sonido por el aire: de la fuente al micrófono. No es cable. */
  "acoustic",
  /** Nivel de línea: de micro/consola/procesador hacia cualquier entrada de línea. */
  "line",
  /** Salida de potencia de un amplificador: vatios sobre una carga. */
  "speaker_level",
  /** Aporte acústico de un parlante al recinto: la única señal que entra al nodo simulation. */
  "simulation_feed",
] as const;

export type SignalDomain = (typeof SIGNAL_DOMAINS)[number];

/**
 * Compatibilidad entre la salida de origen y la entrada de destino.
 *
 * Es igualdad estricta, y hoy no hay conversiones implícitas: un aparato que adapta niveles (una
 * caja de inyección, un transformador) sería un nodo propio con una entrada y una salida de
 * dominios distintos, no una excepción escondida aquí.
 */
export function canCarry(from: SignalDomain, to: SignalDomain): boolean {
  return from === to;
}

const DOMAIN_LABELS: Record<SignalDomain, string> = {
  acoustic: "acústica",
  line: "línea",
  speaker_level: "potencia",
  simulation_feed: "aporte acústico",
};

export function signalDomainLabel(domain: SignalDomain): string {
  return DOMAIN_LABELS[domain];
}

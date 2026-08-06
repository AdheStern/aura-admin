// src/features/signal-flow/resolution/amplifier-load.ts — lectura de powerPerChannelW.
//
// Física: la potencia que entrega una etapa depende de la carga, y por eso AmplifierSpec la publica
// indexada por impedancia ({"8":500,"4":750,"2":1000}) en vez de como un escalar. Bajar la carga
// sube la potencia hasta el límite de corriente de la fuente; por debajo de la carga mínima
// declarada el fabricante no garantiza nada y el ampli entra en protección o se daña.
//
// Aquí solo se LEE la tabla. Convertirla en los vatios que recibe cada caja es la tarea 3; el
// validador usa estas funciones para responder algo más modesto: si la cifra existe.

import type { AmplifierSpec } from "@/contracts/amplifier-spec.schema";

export type PoweredAmplifierSpec = Extract<
  AmplifierSpec,
  { powerPerChannelW: unknown }
>;

export type AmplifierLoadPoint = {
  /** Carga declarada que se usa: la exacta si existe, si no la más cercana. */
  ohm: number;
  watts: number;
  exact: boolean;
};

/** Cargas que el fabricante declara, de menor a mayor. La de 8 Ω siempre está (contrato v1). */
export function supportedLoadsOhm(spec: PoweredAmplifierSpec): number[] {
  const loads: number[] = [];
  for (const [key, watts] of Object.entries(spec.powerPerChannelW)) {
    const ohm = Number(key);
    if (Number.isFinite(ohm) && ohm > 0 && typeof watts === "number") {
      loads.push(ohm);
    }
  }
  return loads.sort((a, b) => a - b);
}

export function minSupportedLoadOhm(spec: PoweredAmplifierSpec): number | null {
  return supportedLoadsOhm(spec)[0] ?? null;
}

/**
 * Potencia por canal para una carga. Devuelve null si la carga está por debajo de la mínima
 * declarada: ahí no se interpola, porque la respuesta honesta es "el fabricante no lo dice".
 */
export function powerAtLoadW(
  spec: PoweredAmplifierSpec,
  loadOhm: number,
): AmplifierLoadPoint | null {
  const loads = supportedLoadsOhm(spec);
  const minimum = loads[0];
  if (minimum === undefined || loadOhm < minimum) return null;

  const nearest = loads.reduce((best, ohm) =>
    Math.abs(ohm - loadOhm) < Math.abs(best - loadOhm) ? ohm : best,
  );
  const watts = spec.powerPerChannelW[String(nearest) as "8"];

  return typeof watts === "number"
    ? { ohm: nearest, watts, exact: nearest === loadOhm }
    : null;
}

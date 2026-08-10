// src/features/simulation/model/spl-scale.ts — la rampa de color del mapa de SPL (§5.4).
//
// Escala FIJA de 70 a 110 dB, no auto-escalada al rango de cada corrida. Es lo que permite comparar
// dos simulaciones de un vistazo: con un dominio que se estira, un mapa uniforme y otro desastroso
// se pintarían igual de verdes.
//
// Cuatro tonos (azul→verde→ámbar→rojo) los pide el doc, y es la convención de la disciplina —
// cualquier software de SPL los usa y el usuario los lee sin leyenda. Es la excepción de "calor
// semántico" a la regla de un solo tono para magnitud, y por eso el mapa SIEMPRE lleva su leyenda
// numerada y su tabla: el color nunca es el único camino al valor.
//
// Se interpola en OKLab y no en sRGB: mezclar azul y verde en sRGB pasa por un gris sucio a mitad
// de camino, que aquí sería una banda muerta justo en la zona de niveles más frecuente.

export const SPL_MIN_DB = 70;
export const SPL_MAX_DB = 110;

/** Los cuatro anclajes, repartidos por igual en el rango. */
const ANCHORS_HEX = ["#0084d1", "#16a34a", "#f59e0b", "#dc2626"] as const;

export type ScaleStop = { db: number; color: string };

export function splColor(db: number): string {
  const t = clamp01((db - SPL_MIN_DB) / (SPL_MAX_DB - SPL_MIN_DB));
  const span = 1 / (ANCHORS.length - 1);
  const index = Math.min(Math.floor(t / span), ANCHORS.length - 2);

  return toHex(
    lerp(ANCHORS[index], ANCHORS[index + 1], (t - index * span) / span),
  );
}

/** Para la leyenda: un peldaño cada 5 dB, que es el salto que el oído nota. */
export function splLegendStops(stepDb = 5): ScaleStop[] {
  const stops: ScaleStop[] = [];
  for (let db = SPL_MIN_DB; db <= SPL_MAX_DB; db += stepDb) {
    stops.push({ db, color: splColor(db) });
  }
  return stops;
}

type Lab = [number, number, number];

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function lerp(from: Lab, to: Lab, t: number): Lab {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  ];
}

function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function toSrgb(channel: number): number {
  const c =
    channel <= 0.0031308
      ? 12.92 * channel
      : 1.055 * channel ** (1 / 2.4) - 0.055;
  return Math.round(clamp01(c) * 255);
}

function hexToLab(hex: string): Lab {
  const r = toLinear(Number.parseInt(hex.slice(1, 3), 16));
  const g = toLinear(Number.parseInt(hex.slice(3, 5), 16));
  const b = toLinear(Number.parseInt(hex.slice(5, 7), 16));

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function toHex([L, a, bb]: Lab): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * bb) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * bb) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * bb) ** 3;

  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];

  return `#${rgb.map((c) => toSrgb(c).toString(16).padStart(2, "0")).join("")}`;
}

const ANCHORS: Lab[] = ANCHORS_HEX.map(hexToLab);

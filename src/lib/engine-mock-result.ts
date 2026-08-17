// src/lib/engine-mock-result.ts — el resultado ampliado que devuelve ENGINE_MODE=mock-full.
//
// `mock` entrega canon-01.expected.json TAL CUAL, y ahí está su valor: son los números del Apéndice
// A.1 y se pueden contrastar con lo que da el motor de verdad. Pero CANON-01 es una sala con una
// caja y sin problemas, así que su resultado no trae grillas, ni alertas, ni recomendaciones — y
// media pantalla de resultados no se puede recorrer con ella.
//
// LIMITACIÓN, y es la razón de que esto sea un modo aparte y no el `mock` de siempre: los números
// de aquí NO son física. Son plausibles y coherentes entre sí —el mapa, el histograma y los
// escalares salen todos de la misma grilla—, nada más. Lo que dependa de que las cifras sean
// correctas se comprueba contra el motor real, nunca contra este modo.

import type { SimulationRequest, SimulationResult } from "@/contracts";

/** Nivel en el punto más cercano a la caja, antes de la caída con la distancia. */
const REFERENCE_DB = 106;
const FALLOFF_DB_PER_DECADE = 12;

export function fullMockResult(
  request: SimulationRequest,
  base: SimulationResult,
): SimulationResult {
  const grid = buildGrid(request);
  const values = grid.valuesDbA ?? [];

  return {
    ...base,
    summary: { ...base.summary, ...splStats(values) },
    grids: { ...base.grids, spl: grid },
    alerts: [
      {
        metric: "uniformity",
        level: "warn",
        detail: { sigmaDb: sigma(values) },
      },
      { metric: "c50", level: "ok" },
    ],
    recommendations: recommendations(request),
  };
}

/** Grilla regular sobre la caja envolvente de la planta, al paso y la altura que pidió la config. */
function buildGrid(request: SimulationRequest) {
  const vertices = request.room.footprint.vertices;
  const step = request.config.grid.resolutionM;
  const earHeight = request.config.grid.earHeightM;

  const minX = Math.min(...vertices.map((vertex) => vertex[0]));
  const maxX = Math.max(...vertices.map((vertex) => vertex[0]));
  const minY = Math.min(...vertices.map((vertex) => vertex[1]));
  const maxY = Math.max(...vertices.map((vertex) => vertex[1]));

  const source = request.sources[0]?.position ?? [minX, minY, earHeight];
  const points: [number, number, number][] = [];
  const valuesDbA: number[] = [];

  for (let y = minY + step / 2; y < maxY; y += step) {
    for (let x = minX + step / 2; x < maxX; x += step) {
      points.push([round(x), round(y), earHeight]);
      valuesDbA.push(levelAt([x, y], source));
    }
  }

  return { points, valuesDbA };
}

/** Caída suave con la distancia horizontal a la caja: da un mapa con estructura, no una mancha. */
function levelAt(point: [number, number], source: readonly number[]): number {
  const distance = Math.hypot(point[0] - source[0], point[1] - source[1]);
  return round(REFERENCE_DB - FALLOFF_DB_PER_DECADE * Math.log10(1 + distance));
}

function splStats(values: number[]) {
  if (values.length === 0) return {};

  return {
    splAvgDb: round(mean(values)),
    splSigmaDb: round(sigma(values)),
    splMinDb: round(Math.min(...values)),
    splMaxDb: round(Math.max(...values)),
  };
}

function recommendations(request: SimulationRequest) {
  const sourceId = request.sources[0]?.id;
  const target = request.config.rtTargetS;

  return [
    ...(sourceId
      ? [
          {
            id: "rec_coverage",
            rule: "CoverageGapRule",
            priority: 1,
            action: {
              type: "reposition_speaker",
              sourceId,
              proposed: { yawDeg: 12, pitchDeg: -4 },
            },
            evidence: { sigmaDb: 4.2, thresholdDb: 3 },
            text: "La cobertura cae más de lo admisible al fondo de la audiencia.",
          },
        ]
      : []),
    // Solo si la escena declaró objetivo: sin rango, RtTargetRule tampoco dispararía en el motor.
    ...(target
      ? [
          {
            id: "rec_rt",
            rule: "RtTargetRule",
            priority: 2,
            action: {
              type: "add_absorption",
              targetRtS: target[1],
              worstBandHz: 125,
              deltaAbsorptionM2ByBand: { "125": 58.5, "250": 41.2 },
            },
            evidence: { rt60S: 2.683, targetS: target },
            text: "El RT60 queda por encima del objetivo en las bandas graves.",
          },
        ]
      : []),
  ];
}

const mean = (values: number[]) =>
  values.reduce((total, value) => total + value, 0) / values.length;

function sigma(values: number[]): number {
  if (values.length === 0) return 0;
  const average = mean(values);
  const variance = mean(values.map((value) => (value - average) ** 2));
  return Math.sqrt(variance);
}

const round = (value: number) => Math.round(value * 100) / 100;

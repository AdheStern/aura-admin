// prisma/seed/microphones.ts — 10 micrófonos del catálogo inicial (Fase 1 del roadmap).
// Las fichas publican el rango de frecuencia pero no la curva tabulada: se reconstruye con la
// regla de derive.ts. El SPL máximo tampoco lo publican los dinámicos —su cápsula no satura en la
// práctica— así que se aplica una convención conservadora declarada en cada ítem.

import type { MicrophoneSpec } from "../../src/contracts/microphone-spec.schema";
import { curveFromSingleRange } from "./derive";

const FICHA = "ficha oficial del fabricante";
const REPRESENTATIVO =
  "valores representativos de la clase de producto — pendientes de contraste con la ficha oficial";

/**
 * Los dinámicos no publican SPL máximo porque la cápsula no llega a saturar en uso real. Se toma
 * 150 dB como techo nominal para que el campo exista sin afirmar un dato que nadie midió.
 */
const DYNAMIC_MAX_SPL_DB = 150;
const CONVENCION_SPL =
  "SPL máx: convención de 150 dB para transductor dinámico (el fabricante no lo publica)";

type MicrophoneRow = {
  brand: string;
  model: string;
  kind: MicrophoneSpec["kind"];
  polarPattern: MicrophoneSpec["polarPattern"];
  range: [number, number];
  mvPerPa: number;
  impedanceOhm: number;
  maxSplDb?: number;
  thdPct?: number;
  selfNoiseDbaSpl?: number;
  weightKg: number;
  /** [ancho, alto, profundidad] en mm. */
  dimensionsMm: [number, number, number];
  dataSource: string;
};

const ROWS: MicrophoneRow[] = [
  {
    brand: "Shure",
    model: "SM57",
    kind: "dynamic",
    polarPattern: "cardioid",
    range: [40, 15000],
    mvPerPa: 1.6,
    impedanceOhm: 310,
    weightKg: 0.284,
    dimensionsMm: [32, 157, 32],
    dataSource: `${FICHA} · instrumento: amplificadores de guitarra, caja, toms, metales`,
  },
  {
    brand: "Shure",
    model: "SM58",
    kind: "dynamic",
    polarPattern: "cardioid",
    range: [50, 15000],
    mvPerPa: 1.6,
    impedanceOhm: 300,
    weightKg: 0.298,
    dimensionsMm: [51, 162, 51],
    dataSource: `${FICHA} · voz en directo, con filtro antipop esférico integrado`,
  },
  {
    brand: "Shure",
    model: "Beta 58A",
    kind: "dynamic",
    polarPattern: "supercardioid",
    range: [50, 16000],
    mvPerPa: 2.6,
    impedanceOhm: 290,
    weightKg: 0.278,
    dimensionsMm: [50, 160, 50],
    dataSource: `${FICHA} · patrón cerrado: más ganancia antes de realimentación`,
  },
  {
    brand: "Shure",
    model: "SM7B",
    kind: "dynamic",
    polarPattern: "cardioid",
    range: [50, 20000],
    mvPerPa: 1.12,
    impedanceOhm: 150,
    weightKg: 0.764,
    dimensionsMm: [117, 199, 96],
    dataSource: `${FICHA} · locución y estudio, con blindaje electromagnético`,
  },
  {
    brand: "Shure",
    model: "Beta 52A",
    kind: "dynamic",
    polarPattern: "supercardioid",
    range: [20, 10000],
    mvPerPa: 0.63,
    impedanceOhm: 150,
    weightKg: 0.605,
    dimensionsMm: [94, 162, 113],
    dataSource: `${FICHA} · bombo y fuentes de baja frecuencia, soporta SPL muy alto`,
  },
  {
    brand: "Shure",
    model: "PGA52",
    kind: "dynamic",
    polarPattern: "cardioid",
    range: [50, 12000],
    mvPerPa: 1.75,
    impedanceOhm: 150,
    weightKg: 0.454,
    dimensionsMm: [67, 108, 67],
    dataSource: `${FICHA} · bombo y amplificadores de bajo`,
  },
  {
    brand: "Shure",
    model: "Beta 57A",
    kind: "dynamic",
    polarPattern: "supercardioid",
    range: [50, 16000],
    mvPerPa: 2.8,
    impedanceOhm: 150,
    weightKg: 0.275,
    dimensionsMm: [38, 160, 38],
    dataSource: `${FICHA} · caja, amplificadores, metales y maderas`,
  },
  {
    brand: "Shure",
    model: "SM81",
    kind: "condenser",
    polarPattern: "cardioid",
    range: [20, 20000],
    mvPerPa: 5.6,
    impedanceOhm: 85,
    maxSplDb: 136,
    thdPct: 1,
    selfNoiseDbaSpl: 16,
    weightKg: 0.23,
    dimensionsMm: [24, 212, 24],
    dataSource: `${FICHA} · corte de graves de 3 posiciones y atenuador de −10 dB`,
  },
  {
    brand: "Shure",
    model: "PGA81",
    kind: "condenser",
    polarPattern: "cardioid",
    range: [40, 18000],
    mvPerPa: 3.8,
    impedanceOhm: 600,
    maxSplDb: 130,
    weightKg: 0.186,
    dimensionsMm: [25, 186, 25],
    dataSource: `${FICHA} · instrumento acústico y aéreos; SPL máx ${REPRESENTATIVO}`,
  },
  // El enum del contrato incluye `ribbon` y la data de origen no lo cubría: sin un micro de cinta
  // el filtro por tipo no se puede ejercitar y falta la familia de transductor más frágil.
  {
    brand: "Royer",
    model: "R-121",
    kind: "ribbon",
    polarPattern: "figure_8",
    range: [30, 15000],
    mvPerPa: 2.0,
    impedanceOhm: 300,
    maxSplDb: 135,
    weightKg: 0.238,
    dimensionsMm: [25, 158, 25],
    dataSource: REPRESENTATIVO,
  },
];

function toSpec(row: MicrophoneRow): MicrophoneSpec {
  const isDynamic = row.kind === "dynamic";
  const maxSplDb = row.maxSplDb ?? DYNAMIC_MAX_SPL_DB;

  return {
    schemaVersion: "1",
    kind: row.kind,
    polarPattern: row.polarPattern,
    frequencyResponse: {
      rangeHz: row.range,
      curve: curveFromSingleRange(row.range),
    },
    sensitivity: { mvPerPa: row.mvPerPa },
    maxSpl: {
      dbSpl: maxSplDb,
      ...(row.thdPct !== undefined ? { thdPct: row.thdPct } : {}),
    },
    ...(row.selfNoiseDbaSpl !== undefined
      ? { selfNoise: { dbaSpl: row.selfNoiseDbaSpl } }
      : {}),
    electrical: {
      impedanceOhm: row.impedanceOhm,
      // Solo el condensador necesita alimentación: dinámicos y de cinta son pasivos.
      phantomPowerRequired: row.kind === "condenser",
      connector: "xlr3",
    },
    physical: { weightKg: row.weightKg, dimensionsMm: row.dimensionsMm },
    dataSource: `${row.dataSource} · curva derivada del rango publicado (ver prisma/seed/derive.ts)${
      row.maxSplDb === undefined && isDynamic ? ` · ${CONVENCION_SPL}` : ""
    }`,
  };
}

export const MICROPHONES = ROWS.map((row) => ({
  brand: row.brand,
  model: row.model,
  spec: toSpec(row),
}));

// prisma/seed/speakers.ts — 15 parlantes del catálogo inicial (Fase 1 del roadmap).
// Las fichas publican rangos de frecuencia, no curvas tabuladas, y en cajas activas no publican
// sensibilidad: ambos se derivan con las reglas de derive.ts. `sensitivity.reference` declara
// literalmente que el valor es derivado, que es para lo que el contrato tiene ese campo.
//
// El DI por banda va por el mismo camino y NO puede faltar: el motor deriva Q de ahí para las
// fórmulas estadísticas y con el diccionario vacío no calcula nada. Casi ninguna ficha lo publica
// como cifra —lo dan en gráfica—, así que se transcribe donde la hay y se deriva de la cobertura
// donde no, contrastando la fórmula contra la única publicada (ver datasets.test.ts).

import type { SpeakerSpec } from "../../src/contracts/speaker-spec.schema";
import {
  continuousFromPeakSpl,
  curveFromRanges,
  diByBand,
  powerFromPeak,
  sensitivityFromMaxSpl,
} from "./derive";

/** Fichas oficiales del fabricante, transcritas de la data de origen del proyecto. */
const FICHA = "ficha oficial del fabricante";
/** Clase de producto correcta y magnitudes del orden correcto, sin contraste ficha a ficha. */
const REPRESENTATIVO =
  "valores representativos de la clase de producto — pendientes de contraste con la ficha oficial";

type SpeakerRow = {
  brand: string;
  model: string;
  kind: SpeakerSpec["kind"];
  transducers: { lf?: string; hf?: string };
  /** Si falta continuousW se reparte el pico con la relación AES (ver derive.ts). */
  power: {
    peakW: number;
    continuousW?: number;
    programW?: number;
    impedanceOhm: number;
  };
  /** SPL máximo de pico publicado. */
  maxSplDb: number;
  range10: [number, number];
  range3: [number, number];
  coverage: { hDeg: number; vDeg: number };
  /** DI nominal SOLO si la ficha lo publica como cifra. La mayoria lo da en grafica, no en tabla. */
  diPublishedDb?: number;
  weightKg: number;
  /** [ancho, alto, profundidad] en mm. */
  dimensionsMm: [number, number, number];
  connectors: string[];
  activePowered: boolean;
  rigging: boolean;
  dataSource: string;
};

const ROWS: SpeakerRow[] = [
  // ---- JBL PRX900: cajas activas de dos y tres vías --------------------------------------
  {
    brand: "JBL",
    model: "PRX908",
    kind: "point_source",
    transducers: { lf: "8in", hf: "1in" },
    power: { peakW: 2000, continuousW: 1000, programW: 1500, impedanceOhm: 8 },
    maxSplDb: 126,
    range10: [55, 20000],
    range3: [65, 20000],
    coverage: { hDeg: 105, vDeg: 60 },
    weightKg: 13.7,
    dimensionsMm: [312, 479, 285],
    connectors: ["xlr3", "combo_jack"],
    activePowered: true,
    rigging: true,
    dataSource: `${FICHA} · G-Sensor: ajusta la ecualización según la orientación de la caja`,
  },
  {
    brand: "JBL",
    model: "PRX912",
    kind: "point_source",
    transducers: { lf: "12in", hf: "1.5in" },
    power: { peakW: 2000, continuousW: 1000, programW: 1500, impedanceOhm: 8 },
    maxSplDb: 132,
    range10: [50, 20000],
    range3: [65, 17000],
    coverage: { hDeg: 90, vDeg: 50 },
    weightKg: 19.5,
    dimensionsMm: [394, 636, 332],
    connectors: ["xlr3", "combo_jack"],
    activePowered: true,
    rigging: true,
    dataSource: `${FICHA} · G-Sensor`,
  },
  {
    brand: "JBL",
    model: "PRX915",
    kind: "point_source",
    transducers: { lf: "15in", hf: "1.5in" },
    power: { peakW: 2000, continuousW: 1000, programW: 1500, impedanceOhm: 8 },
    maxSplDb: 133,
    range10: [48, 19000],
    range3: [60, 16000],
    coverage: { hDeg: 90, vDeg: 50 },
    weightKg: 24.1,
    dimensionsMm: [465, 717, 383],
    connectors: ["xlr3", "combo_jack"],
    activePowered: true,
    rigging: true,
    dataSource: `${FICHA} · G-Sensor`,
  },
  {
    brand: "JBL",
    model: "PRX935",
    kind: "point_source",
    transducers: { lf: "15in", hf: "1.5in" },
    power: { peakW: 2000, continuousW: 1000, programW: 1500, impedanceOhm: 8 },
    maxSplDb: 136.1,
    range10: [40, 20000],
    range3: [46, 18000],
    coverage: { hDeg: 90, vDeg: 50 },
    weightKg: 36.6,
    dimensionsMm: [446, 938, 434],
    connectors: ["xlr3", "combo_jack"],
    activePowered: true,
    rigging: true,
    dataSource: `${FICHA} · sistema de tres vías`,
  },

  // ---- Subwoofers -------------------------------------------------------------------------
  // Cobertura 360°×360°: por debajo del cruce la radiación es omnidireccional, no es un relleno.
  {
    brand: "JBL",
    model: "PRX915XLF",
    kind: "subwoofer",
    transducers: { lf: "15in" },
    power: { peakW: 2000, continuousW: 1000, programW: 1500, impedanceOhm: 8 },
    maxSplDb: 131,
    range10: [36, 98],
    range3: [40, 87],
    coverage: { hDeg: 360, vDeg: 360 },
    weightKg: 28.6,
    dimensionsMm: [480, 549, 580],
    connectors: ["xlr3", "combo_jack"],
    activePowered: true,
    rigging: false,
    dataSource: `${FICHA} · puntos de cruce seleccionables`,
  },
  {
    brand: "JBL",
    model: "PRX918XLF",
    kind: "subwoofer",
    transducers: { lf: "18in" },
    power: { peakW: 2000, continuousW: 1000, programW: 1500, impedanceOhm: 8 },
    maxSplDb: 134,
    range10: [30, 110],
    // La data de origen traía "35-92000 Hz": imposible en un subwoofer, es un typo de 92 Hz.
    range3: [35, 92],
    coverage: { hDeg: 360, vDeg: 360 },
    weightKg: 40.7,
    dimensionsMm: [591, 693, 654],
    connectors: ["xlr3", "combo_jack"],
    activePowered: true,
    rigging: false,
    dataSource: `${FICHA} · rango −3 dB corregido de un typo evidente (92 kHz → 92 Hz)`,
  },
  {
    brand: "JBL",
    model: "PRX418S",
    kind: "subwoofer",
    transducers: { lf: "18in" },
    power: { peakW: 3200, continuousW: 800, programW: 1600, impedanceOhm: 8 },
    maxSplDb: 130,
    range10: [35, 250],
    range3: [52, 120],
    coverage: { hDeg: 360, vDeg: 360 },
    weightKg: 36,
    dimensionsMm: [536, 678, 615],
    connectors: ["speakon_nl4"],
    activePowered: false,
    rigging: false,
    dataSource: `${FICHA} · pasivo: necesita amplificador externo`,
  },

  // ---- JBL PRX800 -------------------------------------------------------------------------
  {
    brand: "JBL",
    model: "PRX812",
    kind: "point_source",
    transducers: { lf: "12in", hf: "1.5in" },
    // La ficha solo publica el pico del sistema (1500 W). Aplicar la relación AES sobre esa cifra
    // daría una continua irrealmente baja y dispararía la sensibilidad derivada, así que se toma
    // la continua de la clase (la mitad del pico) en vez del reparto por defecto.
    power: { peakW: 1500, continuousW: 750, programW: 1125, impedanceOhm: 8 },
    maxSplDb: 135,
    range10: [45, 20000],
    range3: [56, 20000],
    coverage: { hDeg: 90, vDeg: 50 },
    // La unica ficha del catalogo que publica el DI como cifra ("Directivity Index (DI): 10.2 dB,
    // Directivity Factor (Q): 10.4"). Es el ancla contra la que datasets.test.ts contrasta la
    // derivacion del resto: la formula sobre 90x50 da 9.6 dB, 0.6 dB por debajo.
    diPublishedDb: 10.2,
    weightKg: 19.4,
    dimensionsMm: [385, 599, 341],
    connectors: ["xlr3", "combo_jack"],
    activePowered: true,
    rigging: true,
    dataSource: `${FICHA} · control Wi-Fi vía PRX Connect · DI publicado`,
  },

  // ---- Referencia de consumo ---------------------------------------------------------------
  {
    brand: "JBL",
    model: "Charge 4",
    kind: "point_source",
    transducers: { lf: "racetrack" },
    power: { peakW: 30, continuousW: 30, programW: 30, impedanceOhm: 8 },
    maxSplDb: 80,
    range10: [60, 20000],
    range3: [65, 20000],
    // Sin guía de onda: un solo transductor radiando ampliamente, no una cobertura controlada.
    coverage: { hDeg: 180, vDeg: 180 },
    weightKg: 0.965,
    dimensionsMm: [220, 93, 95],
    connectors: ["bluetooth"],
    activePowered: true,
    rigging: false,
    dataSource:
      "altavoz Bluetooth de consumo, mono — sirve de referencia comparativa frente a los 130+ dB de un sistema de PA, no como caja de refuerzo",
  },

  // ---- Elementos de line array --------------------------------------------------------------
  {
    brand: "JBL",
    model: "VRX932LA-1",
    kind: "line_array_element",
    transducers: { lf: "12in", hf: "1in" },
    power: { peakW: 3200, continuousW: 800, programW: 1600, impedanceOhm: 8 },
    maxSplDb: 134,
    range10: [55, 18000],
    range3: [65, 16000],
    coverage: { hDeg: 100, vDeg: 15 },
    weightKg: 30.4,
    dimensionsMm: [597, 318, 470],
    connectors: ["speakon_nl4"],
    activePowered: false,
    rigging: true,
    dataSource: REPRESENTATIVO,
  },
  {
    brand: "RCF",
    model: "HDL 20-A",
    kind: "line_array_element",
    transducers: { lf: "2x10in", hf: "1.75in" },
    power: { peakW: 1400, continuousW: 700, programW: 1050, impedanceOhm: 8 },
    maxSplDb: 135,
    range10: [55, 20000],
    range3: [65, 19000],
    coverage: { hDeg: 100, vDeg: 10 },
    weightKg: 27,
    dimensionsMm: [700, 300, 400],
    connectors: ["xlr3", "powercon"],
    activePowered: true,
    rigging: true,
    dataSource: REPRESENTATIVO,
  },
  {
    brand: "dB Technologies",
    model: "VIO L208",
    kind: "line_array_element",
    transducers: { lf: "2x8in", hf: "1.4in" },
    power: { peakW: 1200, continuousW: 600, programW: 900, impedanceOhm: 8 },
    maxSplDb: 135,
    range10: [59, 19000],
    range3: [70, 18000],
    coverage: { hDeg: 100, vDeg: 10 },
    weightKg: 21,
    dimensionsMm: [640, 267, 400],
    connectors: ["xlr3", "powercon"],
    activePowered: true,
    rigging: true,
    dataSource: REPRESENTATIVO,
  },

  // ---- Monitores de piso ---------------------------------------------------------------------
  {
    brand: "JBL",
    model: "PRX412M",
    kind: "monitor",
    transducers: { lf: "12in", hf: "1in" },
    power: { peakW: 2400, continuousW: 600, programW: 1200, impedanceOhm: 8 },
    maxSplDb: 131,
    range10: [55, 20000],
    range3: [70, 18000],
    coverage: { hDeg: 90, vDeg: 60 },
    weightKg: 21.3,
    dimensionsMm: [546, 419, 419],
    connectors: ["speakon_nl4"],
    activePowered: false,
    rigging: false,
    dataSource: REPRESENTATIVO,
  },
  {
    brand: "QSC",
    model: "K12.2",
    kind: "monitor",
    transducers: { lf: "12in", hf: "1.4in" },
    power: { peakW: 2000, continuousW: 1000, programW: 1500, impedanceOhm: 8 },
    maxSplDb: 132,
    range10: [45, 20000],
    range3: [52, 20000],
    // Guía cónica: misma cobertura en los dos planos.
    coverage: { hDeg: 75, vDeg: 75 },
    weightKg: 16.3,
    dimensionsMm: [356, 594, 358],
    connectors: ["xlr3", "combo_jack"],
    activePowered: true,
    rigging: true,
    dataSource: REPRESENTATIVO,
  },
  {
    brand: "Yamaha",
    model: "DSR112",
    kind: "monitor",
    transducers: { lf: "12in", hf: "2in" },
    power: { peakW: 1300, continuousW: 650, programW: 975, impedanceOhm: 8 },
    maxSplDb: 132,
    range10: [52, 20000],
    range3: [60, 19000],
    coverage: { hDeg: 90, vDeg: 60 },
    weightKg: 20.4,
    dimensionsMm: [365, 605, 380],
    connectors: ["xlr3", "combo_jack"],
    activePowered: true,
    rigging: true,
    dataSource: REPRESENTATIVO,
  },
];

function toSpec(row: SpeakerRow): SpeakerSpec {
  const power = {
    ...powerFromPeak(row.power.peakW),
    ...(row.power.continuousW !== undefined
      ? { continuousW: row.power.continuousW }
      : {}),
    ...(row.power.programW !== undefined
      ? { programW: row.power.programW }
      : {}),
    impedanceOhm: row.power.impedanceOhm,
  };

  return {
    schemaVersion: "1",
    kind: row.kind,
    transducers: row.transducers,
    power,
    sensitivity: {
      dbSpl1w1m: sensitivityFromMaxSpl(row.maxSplDb, power.continuousW),
      reference: "derivada: SPL máx − 10·log₁₀(potencia continua)",
    },
    maxSpl: {
      continuousDb: continuousFromPeakSpl(row.maxSplDb),
      peakDb: row.maxSplDb,
    },
    frequencyResponse: {
      rangeHz: row.range10,
      toleranceDb: 3,
      curve: curveFromRanges(row.range10, row.range3),
    },
    directivity: {
      nominalCoverage: row.coverage,
      // Vacío NO es una opción aunque el contrato lo admita: el motor deriva Q de aquí para las
      // fórmulas estadísticas y con el diccionario vacío no calcula nada. Se transcribe el DI de
      // la ficha donde lo publica y se deriva de la cobertura donde no (ver derive.ts).
      diByBand: diByBand({
        coverage: row.coverage,
        lf: row.transducers.lf ?? "",
        omnidirectional: row.kind === "subwoofer",
        publishedDb: row.diPublishedDb,
      }),
      balloon: null,
    },
    physical: {
      weightKg: row.weightKg,
      dimensionsMm: row.dimensionsMm,
      rigging: row.rigging,
    },
    electrical: {
      connectors: row.connectors,
      activePowered: row.activePowered,
    },
    dataSource: `${row.dataSource} · curva y sensibilidad derivadas (ver prisma/seed/derive.ts)`,
  };
}

export const SPEAKERS = ROWS.map((row) => ({
  brand: row.brand,
  model: row.model,
  spec: toSpec(row),
}));

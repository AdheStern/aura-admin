// prisma/seed/amplifiers.ts — 5 amplificadores del catálogo inicial (Fase 1 del roadmap).
// powerPerChannelW es el único dato del catálogo de equipo que llega al motor: cruzado con la
// impedancia del parlante conectado resuelve el electricalPowerW del SimulationRequest. Por eso
// aquí solo entran amplificadores con etapa de potencia real. Los dos procesadores DSP de la data
// de origen (dbx DriveRack PA2, Behringer DCX2496) no amplifican y viven en reference/, no aquí.

import type { AmplifierSpec } from "../../src/contracts/amplifier-spec.schema";

const REPRESENTATIVO =
  "valores representativos de la clase de producto — pendientes de contraste con la ficha oficial";

type AmplifierRow = {
  brand: string;
  model: string;
  kind: AmplifierSpec["kind"];
  inputChannels: number;
  outputChannels: number;
  /** W por canal según la impedancia de carga. 8Ω es obligatorio: es la carga de referencia. */
  powerPerChannelW: { "8": number; "4"?: number; "2"?: number };
  bridgeable: boolean;
  dsp: boolean;
  crossover: boolean;
  limiter: boolean;
  delayMaxMs?: number;
  mainsVoltageV: number;
  connectors: string[];
  weightKg: number;
  rackUnits: number;
};

const ROWS: AmplifierRow[] = [
  {
    brand: "Crown",
    model: "XLS 1502",
    kind: "amplifier_dsp",
    inputChannels: 2,
    outputChannels: 2,
    powerPerChannelW: { "8": 300, "4": 525 },
    bridgeable: true,
    dsp: true,
    crossover: true,
    limiter: true,
    mainsVoltageV: 220,
    connectors: ["speakon_nl4", "binding_post", "xlr3"],
    weightKg: 5.4,
    rackUnits: 1,
  },
  {
    brand: "Crown",
    model: "XLS 2502",
    kind: "amplifier_dsp",
    inputChannels: 2,
    outputChannels: 2,
    powerPerChannelW: { "8": 440, "4": 775 },
    bridgeable: true,
    dsp: true,
    crossover: true,
    limiter: true,
    mainsVoltageV: 220,
    connectors: ["speakon_nl4", "binding_post", "xlr3"],
    weightKg: 5.9,
    rackUnits: 1,
  },
  {
    brand: "QSC",
    model: "GX5",
    kind: "amplifier",
    inputChannels: 2,
    outputChannels: 2,
    powerPerChannelW: { "8": 500, "4": 700 },
    bridgeable: true,
    // Sin DSP: solo un filtro de corte conmutable para subwoofer.
    dsp: false,
    crossover: true,
    limiter: true,
    mainsVoltageV: 220,
    connectors: ["speakon_nl4", "binding_post", "xlr3"],
    weightKg: 12.2,
    rackUnits: 2,
  },
  {
    brand: "Powersoft",
    model: "Ottocanali 4K4 DSP+",
    kind: "amplifier_dsp",
    inputChannels: 8,
    outputChannels: 8,
    powerPerChannelW: { "8": 500, "4": 500, "2": 375 },
    bridgeable: true,
    dsp: true,
    crossover: true,
    limiter: true,
    delayMaxMs: 1000,
    mainsVoltageV: 220,
    connectors: ["speakon_nl4", "euroblock"],
    weightKg: 9.5,
    rackUnits: 2,
  },
  {
    brand: "Lab.gruppen",
    model: "IPD 2400",
    kind: "amplifier_dsp",
    inputChannels: 2,
    outputChannels: 2,
    powerPerChannelW: { "8": 700, "4": 1200 },
    bridgeable: true,
    dsp: true,
    crossover: true,
    limiter: true,
    delayMaxMs: 1000,
    mainsVoltageV: 220,
    connectors: ["speakon_nl4", "xlr3"],
    weightKg: 7.5,
    rackUnits: 1,
  },
];

function toSpec(row: AmplifierRow): AmplifierSpec {
  return {
    schemaVersion: "1",
    kind: row.kind,
    io: {
      inputChannels: row.inputChannels,
      outputChannels: row.outputChannels,
    },
    powerPerChannelW: row.powerPerChannelW,
    bridgeable: row.bridgeable,
    processing: {
      dsp: row.dsp,
      crossover: row.crossover,
      limiter: row.limiter,
      ...(row.delayMaxMs !== undefined ? { delayMaxMs: row.delayMaxMs } : {}),
    },
    electrical: {
      mainsVoltageV: row.mainsVoltageV,
      connectors: row.connectors,
    },
    physical: { weightKg: row.weightKg, rackUnits: row.rackUnits },
    dataSource: REPRESENTATIVO,
  };
}

export const AMPLIFIERS = ROWS.map((row) => ({
  brand: row.brand,
  model: row.model,
  spec: toSpec(row),
}));

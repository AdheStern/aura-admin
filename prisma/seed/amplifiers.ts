// prisma/seed/amplifiers.ts — el catálogo del nodo `pa`: 5 amplificadores de potencia y los 2
// gestores de altavoces de la data de origen. powerPerChannelW es el único dato del catálogo de
// equipo que llega al motor —cruzado con la impedancia del parlante resuelve el electricalPowerW
// del SimulationRequest—, y por eso los procesadores, que no entregan vatios, entran con la
// variante `processor` del contrato en vez de fingir una potencia que no tienen.

import type { AmplifierSpec } from "../../src/contracts/amplifier-spec.schema";

const REPRESENTATIVO =
  "valores representativos de la clase de producto — pendientes de contraste con la ficha oficial";
const FICHA = "ficha oficial del fabricante";

type AmplifierRow = {
  brand: string;
  model: string;
  kind: AmplifierSpec["kind"];
  inputChannels: number;
  outputChannels: number;
  /** W por canal según la impedancia de carga. Ausente en los procesadores: no amplifican. */
  powerPerChannelW?: { "8": number; "4"?: number; "2"?: number };
  bridgeable: boolean;
  dsp: boolean;
  crossover: boolean;
  limiter: boolean;
  delayMaxMs?: number;
  mainsVoltageV: number;
  connectors: string[];
  weightKg: number;
  rackUnits: number;
  dataSource?: string;
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

  // ---- Gestores de altavoces: mismo nodo `pa`, sin etapa de potencia -----------------------
  // En una cadena real van entre consola y amplificador. El doc modela la cadena como lineal
  // (console→pa→speaker, sin pa→pa), así que Fase 2 tendrá que decidir cómo se encadenan.
  {
    brand: "dbx",
    model: "DriveRack PA2",
    kind: "processor",
    inputChannels: 2,
    outputChannels: 6,
    bridgeable: false,
    dsp: true,
    crossover: true,
    limiter: true,
    delayMaxMs: 1000,
    mainsVoltageV: 220,
    connectors: ["xlr3"],
    weightKg: 2.2,
    rackUnits: 1,
    dataSource: `${FICHA} · AutoEQ de sala, supresión de realimentación, EQ gráfica de 31 bandas por entrada y paramétrica de 8 por salida`,
  },
  {
    brand: "Behringer",
    model: "ULTRADRIVE PRO DCX2496",
    kind: "processor",
    // 2 entradas analógicas + 1 AES/EBU digital.
    inputChannels: 3,
    outputChannels: 6,
    bridgeable: false,
    dsp: true,
    crossover: true,
    limiter: true,
    delayMaxMs: 1000,
    mainsVoltageV: 220,
    connectors: ["xlr3", "aes_ebu"],
    weightKg: 3.1,
    rackUnits: 1,
    dataSource: `${FICHA} · crossover Butterworth/Bessel/Linkwitz-Riley, EQ dinámica por entrada, alineación temporal`,
  },
];

function toSpec(row: AmplifierRow): AmplifierSpec {
  const common = {
    schemaVersion: "1",
    io: {
      inputChannels: row.inputChannels,
      outputChannels: row.outputChannels,
    },
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
    dataSource: row.dataSource ?? REPRESENTATIVO,
  } as const;

  if (row.kind === "processor") {
    return { ...common, kind: "processor" };
  }

  if (!row.powerPerChannelW) {
    throw new Error(
      `${row.brand} ${row.model}: un amplificador debe declarar powerPerChannelW`,
    );
  }
  return {
    ...common,
    kind: row.kind,
    powerPerChannelW: row.powerPerChannelW,
  };
}

export const AMPLIFIERS = ROWS.map((row) => ({
  brand: row.brand,
  model: row.model,
  spec: toSpec(row),
}));

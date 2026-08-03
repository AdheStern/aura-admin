// prisma/seed/consoles.ts — 5 consolas del catálogo inicial (Fase 1 del roadmap).
// io.inputChannels e io.outputBuses son load-bearing: de ahí saca el nodo `console` del flujo de
// señal su número de handles (Sección 5.1). Las fichas de la data de origen traían los canales de
// entrada pero no los buses, así que el conteo de buses va marcado como pendiente de contraste.

import type { ConsoleSpec } from "../../src/contracts/console-spec.schema";

const FICHA = "ficha oficial del fabricante";
const BUSES_REPRESENTATIVOS =
  "conteo de buses representativo de la clase de producto — pendiente de contraste con la ficha oficial";

type ConsoleRow = {
  brand: string;
  model: string;
  kind: ConsoleSpec["kind"];
  inputChannels: number;
  outputBuses: number;
  auxSends?: number;
  matrixOutputs?: number;
  trimRangeDb: [number, number];
  faderRangeDb: [number, number];
  phantomPerChannel: boolean;
  weightKg: number;
  rackUnits?: number;
  dataSource: string;
};

const ROWS: ConsoleRow[] = [
  {
    brand: "Midas",
    model: "M AIR MR18",
    kind: "digital",
    inputChannels: 18,
    outputBuses: 6,
    auxSends: 6,
    trimRangeDb: [-6, 60],
    faderRangeDb: [-90, 10],
    phantomPerChannel: true,
    weightKg: 4.6,
    rackUnits: 2,
    dataSource: `${FICHA} · 16 previos MIDAS PRO, Wi-Fi integrado, interfaz USB 18x18, ULTRANET · ${BUSES_REPRESENTATIVOS}`,
  },
  {
    brand: "Midas",
    model: "M AIR MR12",
    kind: "digital",
    inputChannels: 12,
    outputBuses: 4,
    auxSends: 4,
    trimRangeDb: [-6, 60],
    faderRangeDb: [-90, 10],
    phantomPerChannel: true,
    weightKg: 3.1,
    rackUnits: 1,
    dataSource: `${FICHA} · 4 previos MIDAS PRO y 8 entradas de línea, grabador USB estéreo · ${BUSES_REPRESENTATIVOS}`,
  },
  {
    brand: "Mackie",
    model: "DL32S",
    kind: "digital",
    inputChannels: 32,
    outputBuses: 14,
    auxSends: 12,
    matrixOutputs: 2,
    trimRangeDb: [-20, 60],
    faderRangeDb: [-90, 10],
    phantomPerChannel: true,
    weightKg: 9.1,
    rackUnits: 3,
    dataSource: `${FICHA} · previos Onyx+, control inalámbrico Master Fader, 6 VCA y 6 grupos de mute · ${BUSES_REPRESENTATIVOS}`,
  },
  {
    brand: "Mackie",
    model: "DL16S",
    kind: "digital",
    inputChannels: 16,
    outputBuses: 8,
    auxSends: 6,
    trimRangeDb: [-20, 60],
    faderRangeDb: [-90, 10],
    phantomPerChannel: true,
    weightKg: 6.4,
    rackUnits: 2,
    dataSource: `${FICHA} · previos Onyx+, interfaz USB 16x16 · ${BUSES_REPRESENTATIVOS}`,
  },
  // El enum del contrato incluye `analog` y la data de origen era toda digital: sin una analógica
  // el filtro por tipo no se puede ejercitar.
  {
    brand: "Allen & Heath",
    model: "ZED-14",
    kind: "analog",
    inputChannels: 14,
    outputBuses: 4,
    auxSends: 3,
    trimRangeDb: [0, 60],
    faderRangeDb: [-90, 10],
    // Analógica de esta clase: el phantom se conmuta en bloque, no canal a canal.
    phantomPerChannel: false,
    weightKg: 5.4,
    dataSource:
      "valores representativos de la clase de producto — pendientes de contraste con la ficha oficial",
  },
];

function toSpec(row: ConsoleRow): ConsoleSpec {
  return {
    schemaVersion: "1",
    kind: row.kind,
    io: {
      inputChannels: row.inputChannels,
      outputBuses: row.outputBuses,
      ...(row.auxSends !== undefined ? { auxSends: row.auxSends } : {}),
      ...(row.matrixOutputs !== undefined
        ? { matrixOutputs: row.matrixOutputs }
        : {}),
    },
    gain: { trimRangeDb: row.trimRangeDb, faderRangeDb: row.faderRangeDb },
    phantomPower: { available: true, perChannel: row.phantomPerChannel },
    physical: {
      weightKg: row.weightKg,
      ...(row.rackUnits !== undefined ? { rackUnits: row.rackUnits } : {}),
    },
    dataSource: row.dataSource,
  };
}

export const CONSOLES = ROWS.map((row) => ({
  brand: row.brand,
  model: row.model,
  spec: toSpec(row),
}));

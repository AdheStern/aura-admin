// src/contracts/examples.ts — un ejemplo válido por contrato de catálogo, tipado contra su schema.
// Es la semilla de los formularios de alta (se edita un datasheet que funciona en vez de arrancar
// en blanco) y a la vez el caso positivo de los tests: si un contrato cambia y su ejemplo deja de
// validar, rompe el build aquí y no cuando un administrador guarde el formulario precargado.

import type { AmplifierSpec } from "./amplifier-spec.schema";
import type { ConsoleSpec } from "./console-spec.schema";
import type { MaterialSpec } from "./material-spec.schema";
import type { MicrophoneSpec } from "./microphone-spec.schema";
import type { SpeakerSpec } from "./speaker-spec.schema";

/** Ejemplo literal de la Sección 4.2 del doc maestro. */
export const EXAMPLE_SPEAKER_SPEC: SpeakerSpec = {
  schemaVersion: "1",
  kind: "point_source",
  transducers: { lf: "12in", hf: "1.4in" },
  power: { continuousW: 500, programW: 1000, peakW: 2000, impedanceOhm: 8 },
  sensitivity: { dbSpl1w1m: 96, reference: "2.83V/1m" },
  maxSpl: { continuousDb: 123, peakDb: 129 },
  frequencyResponse: {
    rangeHz: [55, 18000],
    toleranceDb: 3,
    curve: [
      [63, -8.1],
      [125, -1.2],
      [250, 0.3],
      [500, 0],
      [1000, 0.4],
      [2000, -0.6],
      [4000, -1.1],
      [8000, -2.5],
      [16000, -6],
    ],
  },
  directivity: {
    nominalCoverage: { hDeg: 90, vDeg: 60 },
    diByBand: { "500": 8.5, "1000": 9.8, "2000": 11.2, "4000": 12.4 },
    balloon: null,
  },
  physical: { weightKg: 18.4, dimensionsMm: [360, 600, 340], rigging: true },
  electrical: { connectors: ["speakon_nl4"], activePowered: false },
};

/** Ejemplo literal de la Sección 4.2 del doc maestro. */
export const EXAMPLE_MATERIAL_SPEC: MaterialSpec = {
  schemaVersion: "1",
  name: "Ladrillo visto pintado",
  category: "mamposteria",
  absorption: {
    "125": 0.01,
    "250": 0.01,
    "500": 0.02,
    "1000": 0.02,
    "2000": 0.02,
    "4000": 0.03,
  },
  scattering: {
    "125": 0.05,
    "250": 0.05,
    "500": 0.1,
    "1000": 0.1,
    "2000": 0.15,
    "4000": 0.15,
  },
  source: "Tabla Vorländer / catálogo fabricante",
  nrc: 0.02,
};

/** Condensador cardioide de diafragma grande: el caso más común en un catálogo de estudio. */
export const EXAMPLE_MICROPHONE_SPEC: MicrophoneSpec = {
  schemaVersion: "1",
  kind: "condenser",
  polarPattern: "cardioid",
  frequencyResponse: {
    rangeHz: [20, 20000],
    curve: [
      [50, -3],
      [125, -0.5],
      [250, 0],
      [500, 0],
      [1000, 0],
      [2000, 1.5],
      [4000, 3],
      [8000, 2],
      [16000, -2],
    ],
  },
  sensitivity: { mvPerPa: 12.5 },
  maxSpl: { dbSpl: 144, thdPct: 0.5 },
  selfNoise: { dbaSpl: 12 },
  electrical: {
    impedanceOhm: 200,
    phantomPowerRequired: true,
    connector: "xlr3",
  },
  physical: { weightKg: 0.33, dimensionsMm: [56, 165, 56] },
};

/** Consola digital de gira: 32 entradas → 16 buses. */
export const EXAMPLE_CONSOLE_SPEC: ConsoleSpec = {
  schemaVersion: "1",
  kind: "digital",
  io: {
    inputChannels: 32,
    outputBuses: 16,
    auxSends: 8,
    matrixOutputs: 6,
  },
  gain: { trimRangeDb: [-6, 60], faderRangeDb: [-90, 10] },
  phantomPower: { available: true, perChannel: true },
  physical: { weightKg: 21 },
};

/** Amplificador de 4 canales con DSP: el formato habitual de un rack de PA. */
export const EXAMPLE_AMPLIFIER_SPEC: AmplifierSpec = {
  schemaVersion: "1",
  kind: "amplifier_dsp",
  io: { inputChannels: 2, outputChannels: 4 },
  powerPerChannelW: { "8": 500, "4": 750, "2": 1000 },
  bridgeable: true,
  processing: { dsp: true, crossover: true, limiter: true, delayMaxMs: 1000 },
  electrical: { mainsVoltageV: 220, connectors: ["speakon_nl4", "xlr3"] },
  physical: { weightKg: 12.5, rackUnits: 2 },
};

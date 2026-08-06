// src/features/signal-flow/__tests__/fixtures/specs.ts — datasheets mínimos para los tests.
// Valores plausibles pero inventados: lo que se prueba es la topología del grafo, no la física de
// ningún equipo real. Solo son fieles los campos que las reglas leen de verdad —
// activePowered, impedanceOhm, powerPerChannelW, io y amplified — porque de ellos salen los puertos.

import type { AmplifierSpec } from "@/contracts/amplifier-spec.schema";
import type { ConsoleSpec } from "@/contracts/console-spec.schema";
import type { MicrophoneSpec } from "@/contracts/microphone-spec.schema";
import type { SourceSpec } from "@/contracts/source-spec.schema";
import type { SpeakerSpec } from "@/contracts/speaker-spec.schema";
import type { PoweredAmplifierSpec } from "@/features/signal-flow/resolution/amplifier-load";

export function sourceSpec(overrides: Partial<SourceSpec> = {}): SourceSpec {
  return {
    schemaVersion: "1",
    kind: "vocals",
    name: "Voz de prueba",
    fundamentalRangeHz: [100, 250],
    harmonics: "Presencia 2–5 kHz",
    acousticPower: "medium",
    amplified: false,
    ...overrides,
  };
}

export function microphoneSpec(
  overrides: Partial<MicrophoneSpec> = {},
): MicrophoneSpec {
  return {
    schemaVersion: "1",
    kind: "dynamic",
    polarPattern: "cardioid",
    frequencyResponse: {
      rangeHz: [50, 15000],
      curve: [
        [100, -3],
        [1000, 0],
      ],
    },
    sensitivity: { mvPerPa: 2.2 },
    maxSpl: { dbSpl: 150 },
    electrical: {
      impedanceOhm: 300,
      phantomPowerRequired: false,
      connector: "xlr3",
    },
    physical: { weightKg: 0.3 },
    ...overrides,
  };
}

export function consoleSpec(
  io: { inputChannels: number; outputBuses: number } = {
    inputChannels: 16,
    outputBuses: 4,
  },
): ConsoleSpec {
  return {
    schemaVersion: "1",
    kind: "digital",
    io,
    gain: { trimRangeDb: [-6, 60], faderRangeDb: [-90, 10] },
    phantomPower: { available: true, perChannel: true },
    physical: { weightKg: 12 },
  };
}

// Función y no constante compartida: `as const` congelaría los arrays en readonly y los contratos
// los declaran mutables, y un objeto compartido entre fixtures se acabaría mutando en algún test.
function amplifierCommon() {
  return {
    schemaVersion: "1" as const,
    bridgeable: false,
    processing: { dsp: true, crossover: true, limiter: true },
    electrical: { mainsVoltageV: 220, connectors: ["speakon_nl4"] },
    physical: { weightKg: 10, rackUnits: 2 },
  };
}

/** Con etapa de potencia: su salida es speaker_level y solo admite cajas pasivas. */
export function amplifierSpec(
  powerPerChannelW: PoweredAmplifierSpec["powerPerChannelW"] = {
    "8": 400,
    "4": 600,
  },
  io = { inputChannels: 2, outputChannels: 2 },
): AmplifierSpec {
  return { ...amplifierCommon(), kind: "amplifier", io, powerPerChannelW };
}

/** Gestor de altavoces tipo dbx DriveRack: sale línea, así que alimenta amplis o cajas activas. */
export function processorSpec(
  io = { inputChannels: 2, outputChannels: 6 },
): AmplifierSpec {
  return { ...amplifierCommon(), kind: "processor", io };
}

export function speakerSpec(options: {
  activePowered: boolean;
  impedanceOhm?: number;
  continuousW?: number;
}): SpeakerSpec {
  return {
    schemaVersion: "1",
    kind: "point_source",
    transducers: { lf: "12in", hf: "1.4in" },
    power: {
      continuousW: options.continuousW ?? 400,
      programW: 800,
      peakW: 1600,
      impedanceOhm: options.impedanceOhm ?? 8,
    },
    sensitivity: { dbSpl1w1m: 96, reference: "1W/1m" },
    maxSpl: { continuousDb: 122, peakDb: 128 },
    frequencyResponse: {
      rangeHz: [55, 18000],
      toleranceDb: 3,
      curve: [
        [125, -1],
        [1000, 0],
      ],
    },
    directivity: {
      nominalCoverage: { hDeg: 90, vDeg: 60 },
      diByBand: { "1000": 9.8 },
    },
    physical: { weightKg: 18, dimensionsMm: [360, 600, 340], rigging: true },
    electrical: {
      connectors: ["speakon_nl4"],
      activePowered: options.activePowered,
    },
  };
}

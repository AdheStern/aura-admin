// src/features/catalogs/components/example-specs.ts — JSON de ejemplo del doc maestro (Sección
// 4.2), usado para sembrar los textareas de creación en vez de arrancar en blanco.

export const EXAMPLE_SPEAKER_SPEC_JSON = JSON.stringify(
  {
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
  },
  null,
  2,
);

export const EXAMPLE_MATERIAL_SPEC_JSON = JSON.stringify(
  {
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
  },
  null,
  2,
);

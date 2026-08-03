// prisma/seed/materials.ts — 40 materiales del catálogo inicial (Fase 1 del roadmap).
// La absorción viene de tablas estándar publicadas; el scattering NO lo publica ninguna de ellas
// (se mide con ISO 17497, en otro ensayo) y se deriva por familia de superficie — ver derive.ts.
// El campo `source` de cada ítem declara ambas procedencias, porque el principio de "precisión
// honesta" del doc exige que se sepa qué es medido y qué es asumido.

import canonRequest from "../../src/contracts/fixtures/canon-01.request.json";
import type { MaterialSpec } from "../../src/contracts/material-spec.schema";
import {
  byBand,
  nrcFrom,
  type ScatteringProfile,
  scatteringFor,
} from "./derive";

const EVEREST =
  "Everest & Pohlmann, Master Handbook of Acoustics — tabla de coeficientes estándar";
const KUTTRUFF = "Kuttruff / Beranek, Room Acoustics — tablas de referencia";

type MaterialRow = {
  name: string;
  category: string;
  /** α por banda en orden 125 · 250 · 500 · 1k · 2k · 4k. */
  alpha: number[];
  scattering: ScatteringProfile;
  source: string;
  /** Solo cuando hace falta advertir de algo del propio dato (unidades, uso). */
  note?: string;
};

const ROWS: MaterialRow[] = [
  // ---- cortinas ----------------------------------------------------------------------------
  {
    name: "Cortina de algodón 475 g/m², plegada a 7/8 de superficie",
    category: "cortinas",
    alpha: [0.03, 0.12, 0.15, 0.27, 0.37, 0.42],
    scattering: "plegada",
    source: EVEREST,
  },
  {
    name: "Cortina de algodón 475 g/m², plegada a 3/4 de superficie",
    category: "cortinas",
    alpha: [0.04, 0.23, 0.4, 0.57, 0.53, 0.4],
    scattering: "plegada",
    source: EVEREST,
  },
  {
    name: "Cortina de algodón 475 g/m², plegada a 1/2 de superficie",
    category: "cortinas",
    alpha: [0.07, 0.37, 0.49, 0.81, 0.65, 0.54],
    scattering: "plegada",
    source: EVEREST,
  },
  {
    name: "Cortina de terciopelo medio 475 g/m², plegada a 1/2",
    category: "cortinas",
    alpha: [0.07, 0.31, 0.49, 0.75, 0.7, 0.6],
    scattering: "plegada",
    source: EVEREST,
  },
  {
    name: "Cortina de terciopelo pesado 610 g/m², plegada a 1/2",
    category: "cortinas",
    alpha: [0.14, 0.35, 0.55, 0.72, 0.7, 0.65],
    scattering: "plegada",
    source: EVEREST,
  },

  // ---- alfombras ---------------------------------------------------------------------------
  {
    name: "Alfombra gruesa sobre hormigón",
    category: "alfombras",
    alpha: [0.02, 0.06, 0.14, 0.37, 0.6, 0.65],
    scattering: "porosa",
    source: EVEREST,
  },
  {
    name: "Alfombra gruesa sobre fieltro de pelo",
    category: "alfombras",
    alpha: [0.08, 0.24, 0.57, 0.69, 0.71, 0.73],
    scattering: "porosa",
    source: EVEREST,
  },
  {
    name: "Alfombra gruesa con refuerzo de látex sobre fieltro",
    category: "alfombras",
    alpha: [0.08, 0.27, 0.39, 0.34, 0.48, 0.63],
    scattering: "porosa",
    source: EVEREST,
  },
  {
    name: "Alfombra de interior/exterior",
    category: "alfombras",
    alpha: [0.01, 0.05, 0.1, 0.2, 0.45, 0.65],
    scattering: "porosa",
    source: EVEREST,
  },

  // ---- paneles acústicos -------------------------------------------------------------------
  {
    name: "Panel acústico de 13 mm",
    category: "paneles-acusticos",
    alpha: [0.07, 0.21, 0.66, 0.75, 0.62, 0.49],
    scattering: "porosa",
    source: EVEREST,
  },
  {
    name: "Panel acústico de 19 mm",
    category: "paneles-acusticos",
    alpha: [0.09, 0.28, 0.78, 0.84, 0.73, 0.64],
    scattering: "porosa",
    source: EVEREST,
  },
  {
    name: "Panel Owens-Corning Frescor pintado, 16 mm",
    category: "paneles-acusticos",
    alpha: [0.69, 0.86, 0.68, 0.87, 0.9, 0.81],
    scattering: "porosa",
    source: `${EVEREST} (montaje 7)`,
  },

  // ---- mampostería -------------------------------------------------------------------------
  {
    name: "Bloque de hormigón visto, poroso",
    category: "mamposteria",
    alpha: [0.36, 0.44, 0.31, 0.29, 0.39, 0.25],
    scattering: "texturada",
    source: EVEREST,
  },
  {
    name: "Bloque de hormigón pintado",
    category: "mamposteria",
    alpha: [0.1, 0.05, 0.06, 0.07, 0.09, 0.08],
    scattering: "lisa",
    source: EVEREST,
  },
  {
    // El ejemplo canónico de la Sección 4.2 del doc maestro.
    name: "Ladrillo visto pintado",
    category: "mamposteria",
    alpha: [0.01, 0.01, 0.02, 0.02, 0.02, 0.03],
    scattering: "lisa",
    source: "Tabla Vorländer / catálogo fabricante",
  },
  {
    name: "Ladrillo visto sin pintar",
    category: "mamposteria",
    alpha: [0.03, 0.03, 0.03, 0.04, 0.05, 0.07],
    scattering: "texturada",
    source: KUTTRUFF,
  },
  {
    name: "Muro de hormigón visto sin tratar",
    category: "mamposteria",
    alpha: [0.01, 0.01, 0.02, 0.02, 0.02, 0.05],
    scattering: "lisa",
    source: KUTTRUFF,
  },

  // ---- pisos -------------------------------------------------------------------------------
  {
    name: "Piso de hormigón",
    category: "pisos",
    alpha: [0.01, 0.01, 0.015, 0.02, 0.02, 0.02],
    scattering: "lisa",
    source: EVEREST,
  },
  {
    name: "Piso de linóleo, vinílico o corcho sobre hormigón",
    category: "pisos",
    alpha: [0.02, 0.03, 0.03, 0.03, 0.03, 0.02],
    scattering: "lisa",
    source: EVEREST,
  },
  {
    name: "Piso de madera",
    category: "pisos",
    alpha: [0.15, 0.11, 0.1, 0.07, 0.06, 0.07],
    scattering: "texturada",
    source: EVEREST,
  },
  {
    name: "Baldosa cerámica sobre hormigón",
    category: "pisos",
    alpha: [0.01, 0.01, 0.01, 0.02, 0.02, 0.02],
    scattering: "lisa",
    source: KUTTRUFF,
  },
  {
    name: "Parquet sobre asfalto sobre hormigón",
    category: "pisos",
    alpha: [0.04, 0.04, 0.07, 0.06, 0.06, 0.07],
    scattering: "lisa",
    source: KUTTRUFF,
  },

  // ---- vidrio ------------------------------------------------------------------------------
  {
    name: "Vidrio grueso en paños grandes",
    category: "vidrio",
    alpha: [0.18, 0.06, 0.04, 0.03, 0.02, 0.02],
    scattering: "lisa",
    source: EVEREST,
  },
  {
    name: "Vidrio de ventana ordinario",
    category: "vidrio",
    alpha: [0.35, 0.25, 0.18, 0.12, 0.07, 0.04],
    scattering: "lisa",
    source: EVEREST,
  },
  {
    name: "Doble acristalamiento con cámara",
    category: "vidrio",
    alpha: [0.1, 0.07, 0.05, 0.03, 0.02, 0.02],
    scattering: "lisa",
    source: KUTTRUFF,
  },

  // ---- yeso --------------------------------------------------------------------------------
  {
    name: "Yeso o cal, acabado liso sobre ladrillo",
    category: "yeso",
    alpha: [0.013, 0.015, 0.02, 0.03, 0.04, 0.05],
    scattering: "lisa",
    source: EVEREST,
  },
  {
    name: "Yeso o cal, acabado liso sobre listones",
    category: "yeso",
    alpha: [0.14, 0.1, 0.06, 0.05, 0.04, 0.03],
    scattering: "lisa",
    source: EVEREST,
  },
  {
    name: "Placa de yeso de 13 mm sobre montantes a 400 mm",
    category: "yeso",
    alpha: [0.29, 0.1, 0.05, 0.04, 0.07, 0.09],
    scattering: "lisa",
    source: EVEREST,
  },

  // ---- madera ------------------------------------------------------------------------------
  {
    name: "Revestimiento de madera machihembrada",
    category: "madera",
    alpha: [0.19, 0.14, 0.09, 0.06, 0.06, 0.05],
    scattering: "texturada",
    source: KUTTRUFF,
  },
  {
    name: "Panel de contrachapado de 10 mm con cámara de aire",
    category: "madera",
    alpha: [0.28, 0.22, 0.17, 0.09, 0.1, 0.11],
    scattering: "texturada",
    source: KUTTRUFF,
  },
  {
    name: "Puerta de madera maciza",
    category: "madera",
    alpha: [0.14, 0.1, 0.06, 0.08, 0.1, 0.1],
    scattering: "texturada",
    source: KUTTRUFF,
  },

  // ---- absorbentes -------------------------------------------------------------------------
  {
    name: "Lana mineral de 50 mm sobre superficie rígida",
    category: "absorbentes",
    alpha: [0.15, 0.45, 0.75, 0.85, 0.9, 0.9],
    scattering: "porosa",
    source: KUTTRUFF,
  },
  {
    name: "Lana mineral de 100 mm sobre superficie rígida",
    category: "absorbentes",
    alpha: [0.35, 0.75, 0.9, 0.95, 0.95, 0.95],
    scattering: "porosa",
    source: KUTTRUFF,
  },
  {
    name: "Espuma acústica de 50 mm",
    category: "absorbentes",
    alpha: [0.1, 0.3, 0.65, 0.85, 0.9, 0.9],
    scattering: "porosa",
    source: KUTTRUFF,
  },
  {
    name: "Panel de fibra de vidrio de 25 mm",
    category: "absorbentes",
    alpha: [0.08, 0.25, 0.6, 0.8, 0.85, 0.85],
    scattering: "porosa",
    source: KUTTRUFF,
  },

  // ---- techos ------------------------------------------------------------------------------
  {
    name: "Techo suspendido de placas minerales de 15 mm",
    category: "techos",
    alpha: [0.15, 0.35, 0.6, 0.7, 0.65, 0.55],
    scattering: "porosa",
    source: KUTTRUFF,
  },
  {
    name: "Techo metálico perforado con lana mineral",
    category: "techos",
    alpha: [0.3, 0.6, 0.8, 0.85, 0.8, 0.7],
    scattering: "porosa",
    source: KUTTRUFF,
  },

  // ---- audiencia ---------------------------------------------------------------------------
  {
    // Valores normativos del Apéndice A.3. Ojo con la unidad: son m² sabine POR PERSONA, no un α
    // adimensional. El motor los aplica modificando el material del piso de la zona de audiencia
    // según el % de ocupación, interpolando linealmente (Sección 06 del doc).
    name: "Público sentado (mat_audiencia)",
    category: "audiencia",
    alpha: [0.25, 0.35, 0.42, 0.46, 0.5, 0.5],
    scattering: "audiencia",
    source: `${KUTTRUFF} — valores normativos del Apéndice A.3 del doc maestro`,
    note: "m² sabine por persona sentada, no α adimensional",
  },
  {
    name: "Butaca tapizada vacía",
    category: "audiencia",
    alpha: [0.19, 0.37, 0.56, 0.67, 0.61, 0.59],
    scattering: "audiencia",
    source: KUTTRUFF,
  },
];

function toSpec(row: MaterialRow): MaterialSpec {
  const absorption = byBand(row.alpha);
  return {
    schemaVersion: "1",
    name: row.name,
    category: row.category,
    absorption,
    scattering: scatteringFor(row.scattering),
    source: `${row.source} · scattering: perfil "${row.scattering}" derivado (ver prisma/seed/derive.ts)${
      row.note ? ` · ${row.note}` : ""
    }`,
    nrc: nrcFrom(absorption),
  };
}

/**
 * mat_canon sale tal cual de la fixture de CANON-01: es el material del caso analítico y del modo
 * mock del motor. Se importa en vez de recopiarse para que no puedan divergir.
 */
const CANON_MATERIAL = canonRequest.materials.mat_canon as MaterialSpec;

export const MATERIAL_SPECS: MaterialSpec[] = [
  ...ROWS.map(toSpec),
  CANON_MATERIAL,
];

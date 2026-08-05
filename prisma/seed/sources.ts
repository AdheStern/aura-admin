// prisma/seed/sources.ts — las 11 fuentes del nodo `source` de la cadena de señal.
// Curaduría de dominio, no ficha de fabricante: un instrumento no tiene datasheet. Los rangos de
// fundamentales y la descripción del contenido armónico son los que un ingeniero usa para decidir
// microfonía y ecualización. El espectro por banda que consume el motor NO está aquí: vive en
// aura-engine/app/core/acoustics_tables.py (ver el comentario de source-spec.schema.ts).
//
// Sin referenceLevelDb: el doc pide "nivel de referencia" pero no publica valores, y ponerlos a
// ojo por instrumento sería justo lo que este seed evita en todas partes. `acousticPower` es la
// clase cualitativa que la curaduría sí produjo.

import type { SourceSpec } from "../../src/contracts/source-spec.schema";

// Explícito y no Omit<SourceSpec, "schemaVersion">: el contrato es un looseObject y su índice de
// firma hace que Omit se trague las claves conocidas, dejando un tipo que no valida nada.
type SourceRow = {
  kind: SourceSpec["kind"];
  name: string;
  fundamentalRangeHz: [number, number];
  harmonics: string;
  acousticPower: SourceSpec["acousticPower"];
  amplified: boolean;
  notes?: string;
};

const ROWS: SourceRow[] = [
  // ---- percusión ---------------------------------------------------------------------------
  {
    kind: "percussion",
    name: "Bombo (batería)",
    fundamentalRangeHz: [50, 125],
    harmonics: "Ataque en medios-graves (1-4 kHz), chasquido agudo (4-8 kHz)",
    acousticPower: "high",
    amplified: false,
    notes:
      "Base del ritmo. Requiere buena definición de graves y control del retumbe.",
  },
  {
    kind: "percussion",
    name: "Caja / redoblante (batería)",
    fundamentalRangeHz: [150, 250],
    harmonics: "Cuerpo (200-400 Hz), ataque (2-5 kHz), bordonera (5-10 kHz)",
    acousticPower: "high",
    amplified: false,
    notes:
      "Define el backbeat. El equilibrio entre cuerpo y ataque decide la energía de la mezcla.",
  },
  {
    kind: "percussion",
    name: "Toms (batería)",
    fundamentalRangeHz: [80, 200],
    harmonics: "Ataque de baqueta (2-5 kHz), resonancia y sustain",
    acousticPower: "medium_high",
    amplified: false,
    notes: "Controlar la resonancia para que no enturbie la mezcla.",
  },
  {
    kind: "percussion",
    name: "Platillos (batería)",
    fundamentalRangeHz: [300, 1000],
    harmonics: "Contenido agudo extenso (2-20 kHz), cola difusa",
    acousticPower: "high",
    amplified: false,
    notes:
      "Charles, crashes y ride. Se filtran con facilidad en los demás micrófonos.",
  },

  // ---- cuerdas -----------------------------------------------------------------------------
  {
    kind: "strings",
    name: "Guitarra acústica",
    fundamentalRangeHz: [80, 1200],
    harmonics: "Cuerpo (150-300 Hz), definición de cuerda (2-10 kHz)",
    acousticPower: "medium",
    amplified: false,
    notes: "Propensa a realimentación en directo.",
  },
  {
    kind: "strings",
    name: "Guitarra eléctrica",
    fundamentalRangeHz: [80, 1500],
    harmonics: "Rica en medios (500-4000 Hz), definida por ampli y efectos",
    acousticPower: "high",
    amplified: true,
    notes:
      "El timbre lo fija el amplificador y la pantalla, no el instrumento.",
  },
  {
    kind: "strings",
    name: "Bajo eléctrico",
    fundamentalRangeHz: [40, 400],
    harmonics: "Definición de púa/dedo (700-2000 Hz)",
    acousticPower: "high",
    amplified: true,
    notes:
      "Junto al bombo, la base armónica y rítmica. La claridad en medios-graves decide si se oye.",
  },

  // ---- teclados ----------------------------------------------------------------------------
  {
    kind: "keys",
    name: "Piano / teclado eléctrico",
    fundamentalRangeHz: [30, 4200],
    harmonics: "Rango completo; ataque de macillo en medios-agudos",
    acousticPower: "medium_high",
    amplified: true,
    notes:
      "Ocupa casi todo el espectro y compite con casi todo: suele necesitar EQ para dejar sitio.",
  },
  {
    kind: "keys",
    name: "Sintetizador (pad)",
    // La curaduría original decía "variable": un pad puede cubrir todo el rango audible, así que
    // se registra el rango completo en vez de inventar un recorte que el instrumento no tiene.
    fundamentalRangeHz: [20, 20000],
    harmonics:
      "Diseñado para llenar espacio, rico en medios y agudos sostenidos",
    acousticPower: "medium",
    amplified: true,
    notes: "Suele requerir filtros de paso alto y bajo para no enturbiar.",
  },

  // ---- voces -------------------------------------------------------------------------------
  {
    kind: "vocals",
    name: "Voz masculina",
    fundamentalRangeHz: [100, 250],
    harmonics: "Presencia (2-5 kHz), sibilancia (5-10 kHz)",
    acousticPower: "medium",
    amplified: false,
    notes: "El elemento más importante de la mezcla: manda la inteligibilidad.",
  },
  {
    kind: "vocals",
    name: "Voz femenina",
    fundamentalRangeHz: [200, 450],
    harmonics: "Presencia (3-6 kHz), aire (10-15 kHz), sibilancia",
    acousticPower: "medium",
    amplified: false,
    notes:
      "Controlar la sibilancia manteniendo la claridad, sin llegar a la dureza.",
  },
];

export const SOURCES: SourceSpec[] = ROWS.map((row) => ({
  schemaVersion: "1",
  ...row,
}));

// reference/source-spectra.ts — datos de referencia que NO son catálogo de BD.
//
// Instrumentos: el doc maestro es explícito en que el nodo `source` del flujo de señal saca su
// espectro típico y su nivel de referencia de una "tabla interna" (Sección 5.1), que vive en el
// motor —`aura-engine/app/core/acoustics_tables.py`, "espectros de fuentes"— y no en un catálogo.
// La prueba está en el propio contrato: el SimulationRequest no transporta espectros, solo la
// etiqueta `programSpectrum: "live_band"`, que el motor resuelve contra esa tabla. Por eso no hay
// `catalog_instrument` ni lo pide el seed de Fase 1.
//
// Procesadores: el dbx DriveRack PA2 y el Behringer DCX2496 son sistemas de gestión de altavoces,
// sin etapa de potencia. No caben en AmplifierSpec, cuyo powerPerChannelW es justo el campo que
// resuelve el electricalPowerW de la simulación. En una cadena real van entre consola y
// amplificador; el doc colapsa esa posición en un único nodo `pa`.
//
// Todo esto se resuelve en Fase 2 ("Resolución eléctrica del grafo: potencia PA→parlante,
// espectros de programa por fuente"). Se guarda aquí para no perder la curaduría hasta entonces.
// No lo importa nada del runtime: es material de partida, no código de la app.

export type SourceSpectrum = {
  id: string;
  name: string;
  category: "Percussion" | "Strings" | "Keys" | "Vocals";
  /** Rango fundamental en Hz, tal como se documentó en la curaduría original. */
  fundamentalRange: string;
  harmonics: string;
  acousticPower: string;
  notes: string;
};

export const SOURCE_SPECTRA: SourceSpectrum[] = [
  {
    id: "drum-kit-kick",
    name: "Bombo (batería)",
    category: "Percussion",
    fundamentalRange: "50-125 Hz",
    harmonics: "Ataque en medios-graves (1-4 kHz), chasquido agudo (4-8 kHz)",
    acousticPower: "Alta",
    notes:
      "Base del ritmo. Requiere buena definición de graves y control del retumbe.",
  },
  {
    id: "drum-kit-snare",
    name: "Caja / redoblante (batería)",
    category: "Percussion",
    fundamentalRange: "150-250 Hz",
    harmonics: "Cuerpo (200-400 Hz), ataque (2-5 kHz), bordonera (5-10 kHz)",
    acousticPower: "Alta",
    notes:
      "Define el backbeat. El equilibrio entre cuerpo y ataque es determinante en la mezcla.",
  },
  {
    id: "drum-kit-toms",
    name: "Toms (batería)",
    category: "Percussion",
    fundamentalRange: "80-200 Hz",
    harmonics: "Ataque de baqueta (2-5 kHz), resonancia y sustain",
    acousticPower: "Media-alta",
    notes: "Controlar la resonancia para que no enturbie la mezcla.",
  },
  {
    id: "drum-kit-cymbals",
    name: "Platillos (batería)",
    category: "Percussion",
    fundamentalRange: "300-1000 Hz",
    harmonics: "Contenido agudo extenso (2-20 kHz), cola difusa",
    acousticPower: "Alta",
    notes:
      "Charles, crashes y ride. Se filtran con facilidad en los demás micrófonos.",
  },
  {
    id: "guitar-acoustic",
    name: "Guitarra acústica",
    category: "Strings",
    fundamentalRange: "80-1200 Hz",
    harmonics: "Cuerpo (150-300 Hz), definición de cuerda (2-10 kHz)",
    acousticPower: "Media",
    notes: "Propensa a realimentación en directo.",
  },
  {
    id: "guitar-electric",
    name: "Guitarra eléctrica",
    category: "Strings",
    fundamentalRange: "80-1500 Hz",
    harmonics: "Rica en medios (500-4000 Hz), definida por ampli y efectos",
    acousticPower: "Alta (amplificada)",
    notes:
      "El timbre lo fija el amplificador y la pantalla, no el instrumento.",
  },
  {
    id: "bass-electric",
    name: "Bajo eléctrico",
    category: "Strings",
    fundamentalRange: "40-400 Hz",
    harmonics: "Definición de púa/dedo (700-2000 Hz)",
    acousticPower: "Alta (amplificada)",
    notes:
      "Junto al bombo, la base armónica y rítmica. La claridad en medios-graves decide si se oye.",
  },
  {
    id: "keyboard-piano",
    name: "Piano / teclado eléctrico",
    category: "Keys",
    fundamentalRange: "30-4200 Hz",
    harmonics: "Rango completo; ataque de macillo en medios-agudos",
    acousticPower: "Media-alta (amplificada)",
    notes:
      "Ocupa casi todo el espectro y compite con casi todo: suele necesitar EQ para dejar sitio.",
  },
  {
    id: "keyboard-synth-pad",
    name: "Sintetizador (pad)",
    category: "Keys",
    fundamentalRange: "Variable",
    harmonics:
      "Diseñado para llenar espacio, rico en medios y agudos sostenidos",
    acousticPower: "Media (amplificada)",
    notes: "Suele requerir filtros de paso alto y bajo para no enturbiar.",
  },
  {
    id: "vocal-male",
    name: "Voz masculina",
    category: "Vocals",
    fundamentalRange: "100-250 Hz",
    harmonics: "Presencia (2-5 kHz), sibilancia (5-10 kHz)",
    acousticPower: "Media",
    notes: "El elemento más importante de la mezcla: manda la inteligibilidad.",
  },
  {
    id: "vocal-female",
    name: "Voz femenina",
    category: "Vocals",
    fundamentalRange: "200-450 Hz",
    harmonics: "Presencia (3-6 kHz), aire (10-15 kHz), sibilancia",
    acousticPower: "Media",
    notes:
      "Controlar la sibilancia manteniendo la claridad, sin llegar a la dureza.",
  },
];

export type LoudspeakerProcessor = {
  id: string;
  brand: string;
  model: string;
  inputs: number;
  outputs: number;
  features: string[];
  notes: string;
};

export const LOUDSPEAKER_PROCESSORS: LoudspeakerProcessor[] = [
  {
    id: "dbx-driverack-pa2",
    brand: "dbx",
    model: "DriveRack PA2",
    inputs: 2,
    outputs: 6,
    features: [
      "AutoEQ de sala",
      "Supresión de realimentación (AFS)",
      "Compresión dbx",
      "Síntesis de subarmónicos",
      "Crossover (full range, 2 y 3 vías)",
      "Limitadores PeakPlus por salida",
      "Alineación temporal",
      "Control por app (iOS, Android, Mac, Windows)",
    ],
    notes:
      "EQ gráfica de 31 bandas por entrada y paramétrica de 8 por salida. Sin etapa de potencia.",
  },
  {
    id: "behringer-dcx2496",
    brand: "Behringer",
    model: "ULTRADRIVE PRO DCX2496",
    inputs: 3,
    outputs: 6,
    features: [
      "Crossover (Butterworth, Bessel, Linkwitz-Riley)",
      "EQ dinámica por entrada",
      "Limitador por salida",
      "Alineación temporal por entrada y salida",
      "Control remoto por RS-232/RS-485",
    ],
    notes:
      "2 entradas analógicas + 1 AES/EBU. Ruteo muy flexible. Sin etapa de potencia.",
  },
];

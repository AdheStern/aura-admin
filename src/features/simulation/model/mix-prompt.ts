// src/features/simulation/model/mix-prompt.ts — lo que se le pregunta al modelo.
//
// El formato de salida se describe con el MISMO vocabulario que `mixAdviceSchema`, incluidos los
// rangos: lo que se salga de ellos lo rechaza `parseMixAdvice` entero, así que pedirlo mal solo
// gasta tokens para acabar en un error.
//
// Se le pasan los ids de nodo y se le exige uno por instrumento. El modelo inventa ids con
// facilidad —o devuelve doce instrumentos cuando la escena tiene dos—, y el filtro que hay después
// en la action los descarta; decírselo aquí evita llegar a ese punto.
//
// Nada de mayúsculas ni de "CRÍTICO:". Los modelos actuales siguen el prompt de cerca y ese registro
// solo consigue que sobre-apliquen una instrucción a costa de las demás.

import type { MixContext } from "@/features/simulation/model/mix-context";
import type { SceneInstrument } from "@/features/simulation/model/scene-instruments";

export function buildMixPrompt(input: {
  sceneName: string;
  context: MixContext;
  instruments: SceneInstrument[];
}): string {
  const { sceneName, context, instruments } = input;

  return [
    "Eres ingeniero de directo. Ajustas la mezcla de una banda en un recinto cerrado ya simulado.",
    "",
    `Escena: ${sceneName}`,
    "",
    "Medidas de la simulación acústica (RT60 y SPL por banda de octava en Hz):",
    JSON.stringify(context, null, 2),
    "",
    "Instrumentos de la cadena de señal. Usa `nodeId` tal cual como `instrumentId`:",
    JSON.stringify(instruments, null, 2),
    "",
    RULES,
    "",
    "Responde solo con este JSON, sin texto alrededor y sin bloque markdown:",
    SHAPE,
  ].join("\n");
}

const RULES = [
  "Cómo trabajar:",
  "- Devuelve una entrada por cada instrumento de la lista, en el mismo orden, aunque no tenga",
  "  ningún problema: si está bien, dilo con ganancias pequeñas o a cero y explica por qué.",
  "- El balance de niveles es lo más importante de todo: decide cómo se oye la mezcla en la sala.",
  "  Deja en 0 dB el instrumento que lleva la mezcla y expresa los demás respecto a él, en más o en",
  "  menos. No subas todos los canales a la vez: eso no es balance, es ganancia de sistema.",
  "- Subir faders no es empujar la PA. El margen de las cajas lo gobiernan las alertas de",
  "  `deterministic`; tú repartes el peso entre canales dentro de lo que ya hay.",
  "- El panorama es criterio tuyo: el recinto está simulado en mono y ninguna medida lo respalda.",
  "  Centra lo que sostiene la mezcla —voz principal, bajo, bombo— y abre lo que la adorna.",
  "- Las recomendaciones de `deterministic` salen de fórmulas de física y ya están decididas. No",
  "  las contradigas: si una manda subir una banda, no la bajes. Complétalas por instrumento.",
  "- Ajusta el criterio a lo que mide la sala. Un RT60 largo en graves pide cortes en la zona de",
  "  barrido y reverbs cortas; una sala apagada admite más cola.",
  "- `amplified: false` significa que la fuente llega al aire y el micrófono recoge también la sala:",
  "  la ecualización compite con lo que el recinto ya hace.",
  "- Escribe las descripciones en español, concretas y sin adornos: qué hace el ajuste y por qué",
  "  aquí. Nada de frases genéricas que valdrían para cualquier sala.",
].join("\n");

/** Los rangos son los de `mixAdviceSchema`: fuera de ellos la respuesta se descarta entera. */
const SHAPE = `{
  "roomEq": {
    "bands": [
      {
        "band": 1,
        "frequencyHz": 20-20000,
        "gainDb": -24 a 24,
        "q": 0.1 a 18,
        "filterType": "peak" | "low_shelf" | "high_shelf" | "high_pass" | "low_pass",
        "description": "texto breve"
      }
    ],
    "description": "estrategia de la EQ de sala"
  },
  "instruments": [
    {
      "instrumentId": "el nodeId exacto del instrumento",
      "instrumentName": "su nombre",
      "level": {
        "gainDb": -24 a 12, relativo al canal que lleva la mezcla, que va en 0,
        "panPercent": -100 (izquierda) a 100 (derecha), 0 es el centro,
        "description": "por qué este canal va a este nivel y en esta posición"
      },
      "eq": { "bands": [ ...de 4 a 6 bandas, mismo formato... ], "description": "estrategia" },
      "reverb": {
        "type": "plate" | "hall" | "room" | "none",
        "timeMs": 0 a 10000,
        "preDelayMs": 0 a 200,
        "mixPercent": 0 a 60,
        "description": "por qué esta reverb en esta sala"
      },
      "compression": {
        "thresholdDb": -60 a 0,
        "ratio": 1 a 20,
        "attackMs": 0.1 a 200,
        "releaseMs": 5 a 2000,
        "makeupGainDb": 0 a 24,
        "description": "qué controla"
      }
    }
  ],
  "summary": "dos o tres frases sobre la mezcla en esta sala"
}`;

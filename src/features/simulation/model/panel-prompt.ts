// src/features/simulation/model/panel-prompt.ts — qué se le pregunta sobre el tratamiento.
//
// Se le pide DOS paneles y no "los que hagan falta". Dos no tratan una sala —hacen falta muchos más
// metros para bajar un RT60 de verdad— pero enseñan el criterio: dónde primero y por qué. Un plano
// con quince rectángulos no se lee, y además prometería una corrección que dos paneles no dan.
//
// La instrucción que más cambia la respuesta es la de las primeras reflexiones: sin ella el modelo
// reparte los paneles por el perímetro como si todas las paredes fueran equivalentes.
//
// El formato repite el vocabulario de `panelAdviceSchema` con sus rangos, porque lo que se salga lo
// rechaza `parsePanelAdvice` entero.

import type { PanelContext } from "@/features/simulation/model/panel-context";

export function buildPanelPrompt(input: {
  sceneName: string;
  context: PanelContext;
}): string {
  return [
    "Eres consultor de acústica. Dices dónde colgar paneles absorbentes en un recinto ya simulado.",
    "",
    `Escena: ${input.sceneName}`,
    "",
    "La sala y su medida. Los muros van numerados por `wallIndex` y son los que puedes usar:",
    JSON.stringify(input.context, null, 2),
    "",
    RULES,
    "",
    "Responde solo con este JSON, sin texto alrededor y sin bloque markdown:",
    SHAPE,
  ].join("\n");
}

const RULES = [
  "Cómo elegir:",
  "- Propón EXACTAMENTE dos paneles. No es un tratamiento completo y no hay que fingir que lo sea:",
  "  son los dos primeros sitios donde colgarlos, los que más devuelven por metro cuadrado.",
  "- Ponlos donde rebota el sonido directo de las cajas: los puntos de primera reflexión en los",
  "  muros laterales y el muro del fondo, que es el que devuelve el eco tardío hacia el público.",
  "  Usa las posiciones y el `yawDeg` de `speakers` para deducirlo, no repartas por el perímetro.",
  "- No cuelgues nada en un muro que ya absorbe: mira `absorption1kHz`. Por encima de 0.4 esa",
  "  superficie ya está haciendo su trabajo y el panel rinde más en otra.",
  "- `startM` se mide desde el primer vértice del muro, el que `fromM` indica, y el panel tiene que",
  "  caber: `startM + lengthM` no puede pasar de `lengthM` de ese muro.",
  "- Un panel de pared típico va de 0.6 a 2.4 m de ancho y de 1.2 a 2.4 m de alto, colgado con el",
  "  borde inferior alrededor de 1 m del piso, que es donde queda a la altura del oído.",
  "- Si `deterministic` ya trae recomendaciones de absorción, esto las COMPLETA diciendo dónde;",
  "  no las contradigas ni repitas sus cifras.",
  "- Escribe en español, concreto: qué reflexión ataca cada panel y por qué ese muro y no otro.",
].join("\n");

const SHAPE = `{
  "panels": [
    {
      "wallIndex": el índice de muro de la lista, entero,
      "startM": distancia desde el primer vértice del muro,
      "lengthM": ancho del panel en metros (0.5 a 30),
      "heightM": alto del panel en metros (0.5 a 10),
      "mountHeightM": altura del borde inferior sobre el piso (0 a 10),
      "label": "nombre corto, p. ej. 'Primera reflexión lateral'",
      "reason": "qué reflexión ataca y por qué aquí"
    }
  ],
  "material": "de qué es el panel y su espesor, p. ej. 'lana mineral 50 mm con marco y tela'",
  "summary": "dos o tres frases sobre qué se gana con estos dos y qué faltaría después"
}`;

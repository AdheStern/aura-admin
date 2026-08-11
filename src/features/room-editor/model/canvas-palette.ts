// src/features/room-editor/model/canvas-palette.ts — colores del lienzo Konva.
//
// Konva pinta sobre un <canvas> 2D real: `ctx.fillStyle = color` no lee custom properties CSS, así
// que las clases de Tailwind del resto de la app (bg-emerald-500…) no sirven aquí. Se hardcodean los
// mismos tonos en hexadecimal — no oklch(): el soporte de oklch() en canvas 2D es reciente y un
// color no soportado deja el lienzo con el fillStyle anterior en vez de fallar visiblemente, el peor
// modo de fallo posible para un editor. Los grises/fondo replican --background/--border/--foreground
// de globals.css a ojo; el resto son los tonos de acento que ya usa node-registry.ts en la paleta
// del flujo de señal, para que ambos editores lean coherentes.

export type CanvasPalette = {
  background: string;
  gridMinor: string;
  gridMajor: string;
  wall: string;
  wallSelected: string;
  vertexFill: string;
  vertexStroke: string;
  floor: string;
  obstacle: string;
  obstacleSelected: string;
  opening: string;
  openingSelected: string;
  stageZone: string;
  stageZoneStroke: string;
  audienceZone: string;
  audienceZoneStroke: string;
  draft: string;
  measure: string;
  error: string;
  warning: string;
  text: string;
};

const LIGHT: CanvasPalette = {
  background: "#ffffff",
  gridMinor: "#f0f0f2",
  gridMajor: "#d8d8dd",
  wall: "#3f3f46",
  wallSelected: "#0ea5e9",
  vertexFill: "#ffffff",
  vertexStroke: "#3f3f46",
  floor: "#fafafa",
  obstacle: "#a1a1aa",
  obstacleSelected: "#0ea5e9",
  opening: "#f59e0b",
  openingSelected: "#0ea5e9",
  stageZone: "rgba(139, 92, 246, 0.18)",
  stageZoneStroke: "#8b5cf6",
  audienceZone: "rgba(16, 185, 129, 0.18)",
  audienceZoneStroke: "#10b981",
  draft: "#0ea5e9",
  measure: "#e11d48",
  error: "#ef4444",
  warning: "#f59e0b",
  text: "#3f3f46",
};

const DARK: CanvasPalette = {
  background: "#18181b",
  gridMinor: "#232326",
  gridMajor: "#333338",
  wall: "#d4d4d8",
  wallSelected: "#38bdf8",
  vertexFill: "#18181b",
  vertexStroke: "#d4d4d8",
  floor: "#1f1f23",
  obstacle: "#71717a",
  obstacleSelected: "#38bdf8",
  opening: "#fbbf24",
  openingSelected: "#38bdf8",
  stageZone: "rgba(167, 139, 250, 0.22)",
  stageZoneStroke: "#a78bfa",
  audienceZone: "rgba(52, 211, 153, 0.22)",
  audienceZoneStroke: "#34d399",
  draft: "#38bdf8",
  measure: "#fb7185",
  error: "#f87171",
  warning: "#fbbf24",
  text: "#d4d4d8",
};

export function canvasPalette(theme: "light" | "dark"): CanvasPalette {
  return theme === "dark" ? DARK : LIGHT;
}

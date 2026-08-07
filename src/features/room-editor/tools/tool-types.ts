// src/features/room-editor/tools/tool-types.ts — el contrato común de las herramientas del CAD
// (patrón Command aplicado a la INTERACCIÓN, hermano del patrón Command del historial en
// history/command-registry.ts pero en la otra punta: aquí se decide QUÉ comando emitir a partir de
// un gesto de puntero, allá se aplica). Cada herramienta es un objeto de funciones puras — nunca
// toca el store directamente — para que se puedan testear sin Konva ni React de por medio.
//
// Solo las herramientas de INSERCIÓN despachan por aquí (muro, rectángulo, pilar, abertura, zona,
// medición). "Seleccionar/mover" y "borrar" no son herramientas de esta forma: cada figura ya
// existente resuelve su propio click en el componente que la dibuja (ver components/*-layer.tsx),
// porque ahí Konva ya da el hit-testing gratis por figura y reinventarlo aquí sería, para eso,
// exactamente lo que Konva ya hace mejor. Entran en el registro solo para que la tira lateral y el
// cursor los traten como una opción más.

import type { RoomCommand } from "@/features/room-editor/schemas/room-command";
import type {
  Point2d,
  RoomDocument,
} from "@/features/room-editor/schemas/room-document";
import type { RoomSelection } from "@/features/room-editor/store/room-selection";

export type RoomToolKind =
  | "select"
  | "erase"
  | "wall"
  | "rect"
  | "pillarRect"
  | "pillarCircle"
  | "window"
  | "door"
  | "stageZone"
  | "audienceZone"
  | "measure";

export type RoomDraft =
  | { kind: "idle" }
  /** Puntos ya clicados del muro por polilínea, sin cerrar todavía. `cursorM` es el segmento de
   *  goma hasta el puntero — ausente hasta el primer onPointerMove tras el primer clic. */
  | { kind: "wall"; pointsM: Point2d[]; cursorM?: Point2d }
  /** Arrastre de esquina a esquina: rectángulo de planta y zonas rectangulares. */
  | { kind: "drag"; startM: Point2d; currentM: Point2d }
  /** `active` distingue "todavía siguiendo al puntero" de "medición congelada, lista para otra". */
  | { kind: "measure"; startM: Point2d; currentM: Point2d; active: boolean };

export const IDLE_DRAFT: RoomDraft = { kind: "idle" };

export type ToolResult = {
  draft?: RoomDraft;
  command?: RoomCommand;
  select?: RoomSelection | null;
};

export type RoomToolHandlers = {
  label: string;
  /** CSS cursor sobre el lienzo mientras esta herramienta está activa. */
  cursor: string;
  onPointerDown: (
    pointM: Point2d,
    draft: RoomDraft,
    document: RoomDocument,
  ) => ToolResult;
  onPointerMove?: (
    pointM: Point2d,
    draft: RoomDraft,
    document: RoomDocument,
  ) => ToolResult;
  onPointerUp?: (
    pointM: Point2d,
    draft: RoomDraft,
    document: RoomDocument,
  ) => ToolResult;
  /** Tecla Enter: solo la usa el muro por polilínea para cerrar sin volver al primer punto. */
  onEnter?: (draft: RoomDraft, document: RoomDocument) => ToolResult;
};

// src/features/room-editor/validation/issue-codes.ts — catálogo de problemas de la geometría.
//
// La severidad vive aquí y solo aquí: es la que decide si la escena pasa a ROOM_READY (Sección 08),
// así que repartirla por los checks sería repartir la máquina de estados. La frontera es concreta:
// es ERROR lo que impide compilar un RoomGeometry que el motor pueda construir (no hay recinto, no
// hay dónde escuchar, una abertura no cabe en su muro) y AVISO lo que describe una sala rara pero
// simulable (materiales sin asignar, pilares que se pisan, altura inusual).

export type RoomIssueSeverity = "error" | "warning";

const ISSUE_SEVERITY = {
  FOOTPRINT_TOO_FEW_VERTICES: "error",
  FOOTPRINT_DEGENERATE_EDGE: "error",
  FOOTPRINT_SELF_INTERSECTS: "error",
  FOOTPRINT_AREA_TOO_SMALL: "error",
  FOOTPRINT_NOT_CCW: "error",
  WALL_SURFACE_MISMATCH: "error",
  SURFACE_MISSING: "error",
  MATERIAL_MISSING: "error",
  NO_AUDIENCE_ZONE: "error",
  ZONE_NOT_SIMPLE: "error",
  ZONE_OUTSIDE_FOOTPRINT: "error",
  EAR_HEIGHT_ABOVE_CEILING: "error",
  STAGE_ELEVATION_ABOVE_CEILING: "error",
  OBSTACLE_OUTSIDE_FOOTPRINT: "error",
  OPENING_SURFACE_MISSING: "error",
  OPENING_OUT_OF_BOUNDS: "error",

  MATERIAL_NOT_ASSIGNED: "warning",
  ROOM_HEIGHT_UNUSUAL: "warning",
  ZONES_OVERLAP: "warning",
  OBSTACLES_OVERLAP: "warning",
  OBSTACLE_OVER_AUDIENCE: "warning",
  OPENINGS_OVERLAP: "warning",
  OPENING_AREA_EXCESSIVE: "warning",
  // Aviso y no error aunque el motor no sepa qué hacer con una fuente fuera del volumen: la caja
  // sigue estando en el grafo y el recinto sigue compilando: lo que falla es la colocación, y
  // bloquear ROOM_READY por ella obligaría a pasar por el 3D para dar por buena una geometría.
  SPEAKER_OUTSIDE_ROOM: "warning",
} as const satisfies Record<string, RoomIssueSeverity>;

export type RoomIssueCode = keyof typeof ISSUE_SEVERITY;

/** A qué se le pinta el error en el lienzo. El editor resuelve el id a la figura que lo dibuja. */
export type RoomIssueTarget =
  | { kind: "room" }
  | { kind: "footprint" }
  | { kind: "vertex"; index: number }
  | { kind: "surface"; id: string }
  | { kind: "obstacle"; id: string }
  | { kind: "opening"; id: string }
  | { kind: "zone"; id: string }
  /** `id` es el nodeId del grafo: el recinto no le pone id propio a una caja que no crea. */
  | { kind: "speaker"; id: string };

export type RoomIssue = {
  code: RoomIssueCode;
  severity: RoomIssueSeverity;
  /** En español: se muestra tal cual junto a la figura señalada. */
  message: string;
  target: RoomIssueTarget;
};

export function roomIssue(
  code: RoomIssueCode,
  message: string,
  target: RoomIssueTarget,
): RoomIssue {
  return { code, severity: ISSUE_SEVERITY[code], message, target };
}

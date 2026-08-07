// src/features/room-editor/history/command-registry.ts — registro único de comandos del CAD
// (Factory + Registry, §9.1). Añadir una herramienta es añadir una entrada aquí: el despachador, la
// etiqueta de "Deshacer: …" y la regla de fusión salen todos de esta tabla, sin switches repartidos.
//
// `coalesceKey` es lo que hace usable el historial: un arrastre emite un comando por frame y sin
// fusionarlos deshacer un gesto pediría doscientos Ctrl+Z. Solo la tienen los comandos que un gesto
// continuo repite sobre el MISMO objetivo; las altas y bajas nunca se funden.

import type { RoomCommandHandler } from "@/features/room-editor/history/command-result";
import { applyReplaceDocument } from "@/features/room-editor/history/commands/document-commands";
import {
  applyInsertVertex,
  applyMoveVertex,
  applyRemoveVertex,
  applySetFootprint,
  applySetShell,
} from "@/features/room-editor/history/commands/footprint-commands";
import {
  applyInsertObstacle,
  applyRemoveObstacle,
  applyReplaceObstacle,
} from "@/features/room-editor/history/commands/obstacle-commands";
import {
  applyInsertOpening,
  applyRemoveOpening,
  applyReplaceOpening,
} from "@/features/room-editor/history/commands/opening-commands";
import {
  applyRemoveSpeakerPlacement,
  applySetSpeakerPlacement,
} from "@/features/room-editor/history/commands/speaker-commands";
import {
  applySetHeight,
  applySetSurfaceMaterial,
} from "@/features/room-editor/history/commands/surface-commands";
import {
  applyInsertAudienceZone,
  applyRemoveAudienceZone,
  applyReplaceAudienceZone,
  applySetStage,
} from "@/features/room-editor/history/commands/zone-commands";
import type {
  RoomCommandKind,
  RoomCommandOf,
} from "@/features/room-editor/schemas/room-command";

type RoomCommandRegistry = {
  [K in RoomCommandKind]: {
    /** Texto de la entrada del historial, en español y en infinitivo (§9.2). */
    label: string;
    apply: RoomCommandHandler<K>;
    coalesceKey?: (command: RoomCommandOf<K>) => string;
  };
};

export const ROOM_COMMANDS: RoomCommandRegistry = {
  setFootprint: { label: "Dibujar planta", apply: applySetFootprint },
  moveVertex: {
    label: "Mover vértice",
    apply: applyMoveVertex,
    coalesceKey: (command) => `moveVertex:${command.index}`,
  },
  insertVertex: { label: "Añadir vértice", apply: applyInsertVertex },
  removeVertex: { label: "Quitar vértice", apply: applyRemoveVertex },
  setShell: { label: "Restaurar planta", apply: applySetShell },

  setHeight: {
    label: "Cambiar altura",
    apply: applySetHeight,
    coalesceKey: () => "setHeight",
  },
  setSurfaceMaterial: {
    label: "Asignar material",
    apply: applySetSurfaceMaterial,
  },

  insertObstacle: { label: "Añadir pilar", apply: applyInsertObstacle },
  removeObstacle: { label: "Quitar pilar", apply: applyRemoveObstacle },
  replaceObstacle: {
    label: "Editar pilar",
    apply: applyReplaceObstacle,
    coalesceKey: (command) => `replaceObstacle:${command.obstacle.id}`,
  },

  insertOpening: { label: "Añadir abertura", apply: applyInsertOpening },
  removeOpening: { label: "Quitar abertura", apply: applyRemoveOpening },
  replaceOpening: {
    label: "Editar abertura",
    apply: applyReplaceOpening,
    coalesceKey: (command) => `replaceOpening:${command.opening.id}`,
  },

  insertAudienceZone: {
    label: "Añadir zona de audiencia",
    apply: applyInsertAudienceZone,
  },
  removeAudienceZone: {
    label: "Quitar zona de audiencia",
    apply: applyRemoveAudienceZone,
  },
  replaceAudienceZone: {
    label: "Editar zona de audiencia",
    apply: applyReplaceAudienceZone,
    coalesceKey: (command) => `replaceAudienceZone:${command.zone.id}`,
  },

  // Un arrastre del gizmo emite una colocación por frame, igual que mover un vértice: se funden
  // por nodo para que deshacer devuelva la caja a donde estaba antes del gesto, no un frame atrás.
  setSpeakerPlacement: {
    label: "Colocar parlante",
    apply: applySetSpeakerPlacement,
    coalesceKey: (command) => `setSpeakerPlacement:${command.speaker.nodeId}`,
  },
  removeSpeakerPlacement: {
    label: "Quitar colocación del parlante",
    apply: applyRemoveSpeakerPlacement,
  },

  setStage: {
    label: "Editar escenario",
    apply: applySetStage,
    coalesceKey: () => "setStage",
  },

  replaceDocument: { label: "Importar geometría", apply: applyReplaceDocument },
};

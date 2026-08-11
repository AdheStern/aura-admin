// src/features/room-editor/history/commands/surface-commands.ts — altura del recinto y material de
// una superficie. Son los dos comandos que no tocan geometría en planta: cambian un escalar.

import type { RoomCommandHandler } from "@/features/room-editor/history/command-result";

export const applySetHeight: RoomCommandHandler<"setHeight"> = (
  document,
  command,
) => {
  if (document.height.h === command.heightM) return null;

  return {
    next: { ...document, height: { type: "flat", h: command.heightM } },
    inverse: { kind: "setHeight", heightM: document.height.h },
  };
};

export const applySetSurfaceMaterial: RoomCommandHandler<
  "setSurfaceMaterial"
> = (document, command) => {
  const previous = document.surfaces.find(({ id }) => id === command.surfaceId);
  if (!previous || previous.materialId === command.materialId) return null;

  return {
    next: {
      ...document,
      surfaces: document.surfaces.map((surface) =>
        surface.id === command.surfaceId
          ? { ...surface, materialId: command.materialId }
          : surface,
      ),
    },
    inverse: {
      kind: "setSurfaceMaterial",
      surfaceId: command.surfaceId,
      materialId: previous.materialId,
    },
  };
};

// src/features/room-editor/history/commands/opening-commands.ts — ventanas y puertas.
// No comprueban que `surfaceId` sea un muro vivo ni que el hueco quepa: eso lo dice el validador
// con su código de error y su mensaje. Un comando que rechazara geometría dudosa dejaría al usuario
// sin poder dibujar la ventana antes de estirar el muro, y con dos verdades sobre qué es válido.

import type { RoomCommandHandler } from "@/features/room-editor/history/command-result";

export const applyInsertOpening: RoomCommandHandler<"insertOpening"> = (
  document,
  command,
) => {
  if (document.openings.some(({ id }) => id === command.opening.id))
    return null;

  const index = Math.min(command.index, document.openings.length);
  return {
    next: {
      ...document,
      openings: [
        ...document.openings.slice(0, index),
        command.opening,
        ...document.openings.slice(index),
      ],
    },
    inverse: { kind: "removeOpening", id: command.opening.id },
  };
};

export const applyRemoveOpening: RoomCommandHandler<"removeOpening"> = (
  document,
  command,
) => {
  const index = document.openings.findIndex(({ id }) => id === command.id);
  if (index === -1) return null;

  return {
    next: {
      ...document,
      openings: document.openings.filter((_, at) => at !== index),
    },
    inverse: {
      kind: "insertOpening",
      index,
      opening: document.openings[index],
    },
  };
};

export const applyReplaceOpening: RoomCommandHandler<"replaceOpening"> = (
  document,
  command,
) => {
  const previous = document.openings.find(
    ({ id }) => id === command.opening.id,
  );
  if (!previous) return null;

  return {
    next: {
      ...document,
      openings: document.openings.map((opening) =>
        opening.id === command.opening.id ? command.opening : opening,
      ),
    },
    inverse: { kind: "replaceOpening", opening: previous },
  };
};

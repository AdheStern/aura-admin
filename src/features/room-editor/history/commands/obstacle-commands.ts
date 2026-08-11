// src/features/room-editor/history/commands/obstacle-commands.ts — pilares.
// El inverso de una baja restaura la POSICIÓN en la lista, no solo la entidad: el orden es el que
// el compilador serializa, y un pilar que reaparece al final tras deshacer cambiaría el JSON que se
// envía al motor sin que el usuario haya movido nada.

import type { RoomCommandHandler } from "@/features/room-editor/history/command-result";

export const applyInsertObstacle: RoomCommandHandler<"insertObstacle"> = (
  document,
  command,
) => {
  if (document.obstacles.some(({ id }) => id === command.obstacle.id)) {
    return null;
  }

  const index = Math.min(command.index, document.obstacles.length);
  return {
    next: {
      ...document,
      obstacles: [
        ...document.obstacles.slice(0, index),
        command.obstacle,
        ...document.obstacles.slice(index),
      ],
    },
    inverse: { kind: "removeObstacle", id: command.obstacle.id },
  };
};

export const applyRemoveObstacle: RoomCommandHandler<"removeObstacle"> = (
  document,
  command,
) => {
  const index = document.obstacles.findIndex(({ id }) => id === command.id);
  if (index === -1) return null;

  return {
    next: {
      ...document,
      obstacles: document.obstacles.filter((_, at) => at !== index),
    },
    inverse: {
      kind: "insertObstacle",
      index,
      obstacle: document.obstacles[index],
    },
  };
};

export const applyReplaceObstacle: RoomCommandHandler<"replaceObstacle"> = (
  document,
  command,
) => {
  const previous = document.obstacles.find(
    ({ id }) => id === command.obstacle.id,
  );
  if (!previous) return null;

  return {
    next: {
      ...document,
      obstacles: document.obstacles.map((obstacle) =>
        obstacle.id === command.obstacle.id ? command.obstacle : obstacle,
      ),
    },
    inverse: { kind: "replaceObstacle", obstacle: previous },
  };
};

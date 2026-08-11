// src/features/room-editor/history/commands/zone-commands.ts — audiencia y escenario.
// El escenario es único (el contrato lo declara como objeto opcional, no como lista), así que no
// necesita alta ni baja propias: setStage con null lo borra y su inverso lo devuelve entero.

import type { RoomCommandHandler } from "@/features/room-editor/history/command-result";

export const applyInsertAudienceZone: RoomCommandHandler<
  "insertAudienceZone"
> = (document, command) => {
  const { audience } = document.zones;
  if (audience.some(({ id }) => id === command.zone.id)) return null;

  const index = Math.min(command.index, audience.length);
  return {
    next: {
      ...document,
      zones: {
        ...document.zones,
        audience: [
          ...audience.slice(0, index),
          command.zone,
          ...audience.slice(index),
        ],
      },
    },
    inverse: { kind: "removeAudienceZone", id: command.zone.id },
  };
};

export const applyRemoveAudienceZone: RoomCommandHandler<
  "removeAudienceZone"
> = (document, command) => {
  const { audience } = document.zones;
  const index = audience.findIndex(({ id }) => id === command.id);
  if (index === -1) return null;

  return {
    next: {
      ...document,
      zones: {
        ...document.zones,
        audience: audience.filter((_, at) => at !== index),
      },
    },
    inverse: { kind: "insertAudienceZone", index, zone: audience[index] },
  };
};

export const applyReplaceAudienceZone: RoomCommandHandler<
  "replaceAudienceZone"
> = (document, command) => {
  const { audience } = document.zones;
  const previous = audience.find(({ id }) => id === command.zone.id);
  if (!previous) return null;

  return {
    next: {
      ...document,
      zones: {
        ...document.zones,
        audience: audience.map((zone) =>
          zone.id === command.zone.id ? command.zone : zone,
        ),
      },
    },
    inverse: { kind: "replaceAudienceZone", zone: previous },
  };
};

export const applySetStage: RoomCommandHandler<"setStage"> = (
  document,
  command,
) => {
  const previous = document.zones.stage;
  if (previous === null && command.stage === null) return null;

  return {
    next: { ...document, zones: { ...document.zones, stage: command.stage } },
    inverse: { kind: "setStage", stage: previous },
  };
};

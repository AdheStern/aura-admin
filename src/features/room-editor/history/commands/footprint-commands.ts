// src/features/room-editor/history/commands/footprint-commands.ts — la planta del recinto.
// Los tres comandos que cambian la TOPOLOGÍA (setFootprint, insertVertex, removeVertex) se
// invierten con un setShell porque reordenan los muros y pueden llevarse aberturas por delante;
// moveVertex no toca la topología y se invierte con el punto anterior, que además es lo que permite
// fundir los cientos de pasos de un arrastre en una sola entrada del historial.

import type { RoomCommandHandler } from "@/features/room-editor/history/command-result";
import { arePointsEqual } from "@/features/room-editor/model/geometry-2d";
import { isCcw, reversePolygon } from "@/features/room-editor/model/polygon-2d";
import {
  mergeWallShell,
  type RoomShell,
  setFootprintShell,
  shellOf,
  splitWallShell,
  withShell,
} from "@/features/room-editor/model/wall-surfaces";
import type { RoomCommand } from "@/features/room-editor/schemas/room-command";
import type { Polygon2d } from "@/features/room-editor/schemas/room-document";

export const applySetFootprint: RoomCommandHandler<"setFootprint"> = (
  document,
  command,
) => {
  const shell = setFootprintShell(shellOf(document), toCcw(command.vertices));
  return {
    next: withShell(document, shell),
    inverse: shellCommand(shellOf(document)),
  };
};

export const applyMoveVertex: RoomCommandHandler<"moveVertex"> = (
  document,
  command,
) => {
  const previous = document.footprint.vertices[command.index];
  if (!previous || arePointsEqual(previous, command.atM)) return null;

  const vertices = document.footprint.vertices.map((vertex, index) =>
    index === command.index ? command.atM : vertex,
  );
  return {
    next: { ...document, footprint: { vertices } },
    inverse: { kind: "moveVertex", index: command.index, atM: previous },
  };
};

export const applyInsertVertex: RoomCommandHandler<"insertVertex"> = (
  document,
  command,
) => {
  const { vertices } = document.footprint;
  if (command.index >= vertices.length) return null;

  const split = [
    ...vertices.slice(0, command.index + 1),
    command.atM,
    ...vertices.slice(command.index + 1),
  ];
  return {
    next: withShell(
      document,
      splitWallShell(shellOf(document), command.index, split),
    ),
    inverse: shellCommand(shellOf(document)),
  };
};

export const applyRemoveVertex: RoomCommandHandler<"removeVertex"> = (
  document,
  command,
) => {
  const { vertices } = document.footprint;
  if (command.index >= vertices.length) return null;

  const remaining = vertices.filter((_, index) => index !== command.index);
  return {
    next: withShell(
      document,
      mergeWallShell(shellOf(document), command.index, remaining),
    ),
    inverse: shellCommand(shellOf(document)),
  };
};

export const applySetShell: RoomCommandHandler<"setShell"> = (
  document,
  command,
) => ({
  next: withShell(document, {
    vertices: command.vertices,
    surfaces: command.surfaces,
    openings: command.openings,
  }),
  inverse: shellCommand(shellOf(document)),
});

/**
 * El contrato exige vértices CCW y este es el único sitio donde entra una planta entera, así que es
 * el único que puede invertirla. A partir de aquí la orientación es invariante del documento: un
 * polígono simple no puede cambiar de sentido moviendo un vértice sin pasar por auto-intersección,
 * que el validador ya bloquea. Normalizar aquí evita tener que voltear también la `x` local de cada
 * abertura, que es lo que costaría hacerlo al compilar.
 */
function toCcw(vertices: Polygon2d): Polygon2d {
  return vertices.length >= 3 && !isCcw(vertices)
    ? reversePolygon(vertices)
    : vertices;
}

function shellCommand(shell: RoomShell): RoomCommand {
  return {
    kind: "setShell",
    vertices: shell.vertices,
    surfaces: shell.surfaces,
    openings: shell.openings,
  };
}

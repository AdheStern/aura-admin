// src/features/room-editor/__tests__/footprint-commands.test.ts — la correspondencia muro↔arista.
// Es el invariante más frágil del editor: los muros se identifican por ORDEN de cara al contrato y
// por ID de cara a las aberturas, así que editar la planta tiene que mover las dos cosas a la vez.

import { describe, expect, it } from "vitest";
import {
  buildRoom,
  rectVertices,
  wallIds,
  windowOpening,
} from "@/features/room-editor/__tests__/fixtures/room-builder";
import { applyRoomCommand } from "@/features/room-editor/history/apply-room-command";
import {
  runRoomCommand,
  startRoomSession,
  undoRoomCommand,
} from "@/features/room-editor/history/room-session";
import { isCcw } from "@/features/room-editor/model/polygon-2d";
import type { RoomCommand } from "@/features/room-editor/schemas/room-command";

const VERTICES = rectVertices(20, 12);

const room = () => buildRoom({ kind: "setFootprint", vertices: VERTICES });

function apply(
  document: ReturnType<typeof room>,
  command: RoomCommand,
): ReturnType<typeof room> {
  const result = applyRoomCommand(document, command);
  if (!result) throw new Error(`Comando sin efecto: ${command.kind}`);
  return result.next;
}

describe("setFootprint", () => {
  it("crea un muro por arista y conserva piso y techo", () => {
    const document = room();

    expect(wallIds(document)).toEqual(["wall_0", "wall_1", "wall_2", "wall_3"]);
    expect(document.surfaces.filter((s) => s.type !== "wall")).toHaveLength(2);
  });

  it("normaliza a antihorario una planta dibujada en sentido horario", () => {
    const clockwise = [...VERTICES].reverse();
    const document = buildRoom({ kind: "setFootprint", vertices: clockwise });

    expect(isCcw(document.footprint.vertices)).toBe(true);
  });

  it("conserva por posición los materiales ya asignados al redibujar", () => {
    const withMaterial = apply(room(), {
      kind: "setSurfaceMaterial",
      surfaceId: "wall_2",
      materialId: "mat_brick",
    });
    const redrawn = apply(withMaterial, {
      kind: "setFootprint",
      vertices: rectVertices(30, 18),
    });

    expect(
      redrawn.surfaces.find((surface) => surface.id === "wall_2")?.materialId,
    ).toBe("mat_brick");
  });
});

describe("insertVertex", () => {
  it("parte la arista en dos muros y deja los demás donde estaban", () => {
    const document = apply(room(), {
      kind: "insertVertex",
      index: 1,
      atM: [20, 6],
    });

    expect(document.footprint.vertices).toHaveLength(5);
    expect(wallIds(document)).toEqual([
      "wall_0",
      "wall_1",
      "wall_4",
      "wall_2",
      "wall_3",
    ]);
  });

  // El id del muro sobrevive aunque cambie su índice: por eso las aberturas guardan surfaceId y no
  // la posición de la arista.
  it("mantiene la abertura en su muro aunque se desplace de índice", () => {
    const withWindow = apply(room(), {
      kind: "insertOpening",
      index: 0,
      opening: windowOpening("op_1", "wall_2"),
    });
    const document = apply(withWindow, {
      kind: "insertVertex",
      index: 0,
      atM: [10, 0],
    });

    expect(document.openings[0].surfaceId).toBe("wall_2");
    expect(wallIds(document).indexOf("wall_2")).toBe(3);
  });
});

describe("removeVertex", () => {
  it("funde las dos aristas del vértice y quita un solo muro", () => {
    const document = apply(room(), { kind: "removeVertex", index: 1 });

    expect(document.footprint.vertices).toHaveLength(3);
    expect(wallIds(document)).toEqual(["wall_0", "wall_2", "wall_3"]);
  });

  // Borrar el vértice 0 funde la última arista con la primera: la fundida queda al FINAL de la
  // lista, que es donde el contrato espera leer la arista que cierra el polígono.
  it("deja los muros en orden de arista al borrar el vértice 0", () => {
    const document = apply(room(), { kind: "removeVertex", index: 0 });

    expect(wallIds(document)).toEqual(["wall_1", "wall_2", "wall_3"]);
  });

  it("se lleva las aberturas del muro que desaparece y deshacer las devuelve", () => {
    const withWindow = apply(room(), {
      kind: "insertOpening",
      index: 0,
      opening: windowOpening("op_1", "wall_1"),
    });

    const session = runRoomCommand(
      startRoomSession(withWindow),
      { kind: "removeVertex", index: 1 },
      0,
    );
    expect(session.document.openings).toEqual([]);

    expect(undoRoomCommand(session).document).toEqual(withWindow);
  });
});

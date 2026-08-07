// src/features/room-editor/__tests__/room-history.test.ts — deshacer/rehacer.
// La prueba que de verdad importa es la primera: una sesión completa deshecha paso a paso tiene que
// devolver EXACTAMENTE el documento de partida. Si un comando calcula mal su inverso, el editor
// acumula deriva silenciosa y el usuario acaba guardando una sala que nunca dibujó.

import { describe, expect, it } from "vitest";
import {
  audienceZone,
  rectPillar,
  rectVertices,
} from "@/features/room-editor/__tests__/fixtures/room-builder";
import { undoLabel } from "@/features/room-editor/history/room-history";
import {
  type RoomSession,
  redoRoomCommand,
  runRoomCommand,
  startRoomSession,
  undoRoomCommand,
} from "@/features/room-editor/history/room-session";
import type { RoomCommand } from "@/features/room-editor/schemas/room-command";
import { EMPTY_ROOM } from "@/features/room-editor/schemas/room-document";

const VERTICES = rectVertices(20, 12);

/** Una sesión de trabajo verosímil: dibujar, ajustar y decorar. */
const SESSION: RoomCommand[] = [
  { kind: "setFootprint", vertices: VERTICES },
  { kind: "setHeight", heightM: 6 },
  {
    kind: "insertAudienceZone",
    index: 0,
    zone: audienceZone("zone_1", rectVertices(16, 10)),
  },
  { kind: "insertObstacle", index: 0, obstacle: rectPillar("p1", [8, 5]) },
  { kind: "setSurfaceMaterial", surfaceId: "wall_1", materialId: "mat_brick" },
  { kind: "moveVertex", index: 2, atM: [22, 12] },
];

/** Un segundo entre comandos: fuera de la ventana de fusión, cada uno es su propia entrada. */
function play(commands: RoomCommand[]): RoomSession {
  return commands.reduce(
    (session, command, step) => runRoomCommand(session, command, step * 1000),
    startRoomSession(EMPTY_ROOM),
  );
}

function repeat(
  session: RoomSession,
  times: number,
  step: (s: RoomSession) => RoomSession,
) {
  return Array.from({ length: times }).reduce<RoomSession>(
    (current) => step(current),
    session,
  );
}

describe("sesión completa", () => {
  it("deshacer todo devuelve el documento inicial y rehacer todo el final", () => {
    const played = play(SESSION);
    expect(played.history.past).toHaveLength(SESSION.length);

    const undone = repeat(played, SESSION.length, undoRoomCommand);
    expect(undone.document).toEqual(EMPTY_ROOM);
    expect(undone.history.past).toHaveLength(0);

    const redone = repeat(undone, SESSION.length, redoRoomCommand);
    expect(redone.document).toEqual(played.document);
  });

  it("deshacer con el historial vacío no cambia nada", () => {
    const session = startRoomSession(EMPTY_ROOM);
    expect(undoRoomCommand(session)).toBe(session);
    expect(redoRoomCommand(session)).toBe(session);
  });

  it("un comando nuevo descarta la rama de rehacer", () => {
    const undone = undoRoomCommand(play(SESSION));
    expect(undone.history.future).toHaveLength(1);

    const forked = runRoomCommand(undone, { kind: "setHeight", heightM: 9 }, 0);
    expect(forked.history.future).toHaveLength(0);
  });

  it("nombra la acción que se va a deshacer", () => {
    expect(undoLabel(play(SESSION).history)).toBe("Mover vértice");
  });
});

describe("comandos sin efecto", () => {
  it("no apila el gesto que suelta el vértice donde estaba", () => {
    const drawn = play([SESSION[0]]);
    const still = runRoomCommand(
      drawn,
      { kind: "moveVertex", index: 0, atM: VERTICES[0] },
      1000,
    );

    expect(still).toBe(drawn);
  });

  it("no apila un comando que nombra un id inexistente", () => {
    const drawn = play([SESSION[0]]);
    const missing = runRoomCommand(
      drawn,
      { kind: "removeObstacle", id: "no-existe" },
      1000,
    );

    expect(missing).toBe(drawn);
  });
});

describe("fusión de gestos", () => {
  // Konva emite un comando por frame mientras se arrastra. Sin fusión, deshacer un solo gesto
  // pediría cincuenta Ctrl+Z y el historial dejaría de servir para nada.
  it("un arrastre de 50 pasos deja una sola entrada que revierte el gesto entero", () => {
    const drawn = play([SESSION[0]]);
    const dragged = Array.from({ length: 50 }).reduce<RoomSession>(
      (session, _, step) =>
        runRoomCommand(
          session,
          { kind: "moveVertex", index: 1, atM: [21 + step, 0] },
          step * 16,
        ),
      drawn,
    );

    expect(dragged.history.past).toHaveLength(drawn.history.past.length + 1);
    expect(dragged.document.footprint.vertices[1]).toEqual([70, 0]);
    expect(undoRoomCommand(dragged).document).toEqual(drawn.document);
  });

  it("no funde dos ediciones separadas en el tiempo", () => {
    const drawn = play([SESSION[0]]);
    const first = runRoomCommand(
      drawn,
      { kind: "moveVertex", index: 1, atM: [21, 0] },
      0,
    );
    const second = runRoomCommand(
      first,
      { kind: "moveVertex", index: 1, atM: [22, 0] },
      5000,
    );

    expect(second.history.past).toHaveLength(drawn.history.past.length + 2);
  });
});

describe("tope del historial", () => {
  it("recorta por el extremo viejo al pasar de 100 entradas", () => {
    const long = play([
      SESSION[0],
      ...Array.from({ length: 120 }, (_, step) => ({
        kind: "moveVertex" as const,
        index: step % 4,
        atM: [step + 1, step + 1] as [number, number],
      })),
    ]);

    expect(long.history.past).toHaveLength(100);
    expect(long.history.past[0].command.kind).toBe("moveVertex");
  });
});

// src/features/simulation/__tests__/can-simulate.test.ts

import { describe, expect, it } from "vitest";
import {
  audienceZone,
  buildRoom,
  rectVertices,
} from "@/features/room-editor/__tests__/fixtures/room-builder";
import type { RoomDocument } from "@/features/room-editor/schemas/room-document";
import { canSimulate } from "@/features/simulation/model/can-simulate";

const room = (materialId: string | null): RoomDocument => {
  const vertices = rectVertices(20, 12);
  const document = buildRoom(
    { kind: "setFootprint", vertices },
    {
      kind: "insertAudienceZone",
      index: 0,
      zone: audienceZone("zone_1", vertices),
    },
  );
  return {
    ...document,
    surfaces: document.surfaces.map((surface) => ({ ...surface, materialId })),
  };
};

const codesFor = (input: Parameters<typeof canSimulate>[0]) =>
  canSimulate(input).blockers.map((blocker) => blocker.code);

describe("canSimulate", () => {
  it("deja simular una escena lista, con materiales y cajas", () => {
    const readiness = canSimulate({
      sceneStatus: "ROOM_READY",
      document: room("mat_1"),
      speakerCount: 2,
    });

    expect(readiness.canSimulate).toBe(true);
    expect(readiness.blockers).toEqual([]);
  });

  // ROOM_READY se alcanza con materiales sin asignar (es aviso, no error), pero el contrato los
  // exige: esta es justamente la brecha que el botón tiene que explicar en vez de fallar al enviar.
  it("bloquea por materiales sin asignar aunque la escena esté en ROOM_READY", () => {
    expect(
      codesFor({
        sceneStatus: "ROOM_READY",
        document: room(null),
        speakerCount: 1,
      }),
    ).toEqual(["MATERIAL_NOT_ASSIGNED"]);
  });

  it("bloquea si ninguna caja llega al nodo de simulación", () => {
    expect(
      codesFor({
        sceneStatus: "ROOM_READY",
        document: room("mat_1"),
        speakerCount: 0,
      }),
    ).toEqual(["NO_SIMULATED_SPEAKER"]);
  });

  it("bloquea si la escena todavía no llegó a ROOM_READY", () => {
    expect(
      codesFor({
        sceneStatus: "FLOW_READY",
        document: room("mat_1"),
        speakerCount: 1,
      }),
    ).toEqual(["SCENE_NOT_READY"]);
  });

  it("una escena ya simulada se puede volver a simular", () => {
    expect(
      canSimulate({
        sceneStatus: "SIMULATED",
        document: room("mat_1"),
        speakerCount: 1,
      }).canSimulate,
    ).toBe(true);
  });

  it("junta todas las razones en vez de parar en la primera", () => {
    expect(
      codesFor({
        sceneStatus: "DRAFT",
        document: room(null),
        speakerCount: 0,
      }),
    ).toEqual([
      "SCENE_NOT_READY",
      "MATERIAL_NOT_ASSIGNED",
      "NO_SIMULATED_SPEAKER",
    ]);
  });
});

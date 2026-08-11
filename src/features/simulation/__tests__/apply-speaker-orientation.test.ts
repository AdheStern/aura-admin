// src/features/simulation/__tests__/apply-speaker-orientation.test.ts
//
// Lo que importa: aplicar cambia SOLO lo que la regla propuso (yaw y pitch), materializa la caja si
// nunca se movió, y no toca a las demás.

import { describe, expect, it } from "vitest";
import shoebox from "@/features/room-editor/fixtures/shoebox-with-stage.json";
import { parseRoom } from "@/features/room-editor/schemas/parse-room";
import type { RoomDocument } from "@/features/room-editor/schemas/room-document";
import { applySpeakerOrientation } from "@/features/simulation/model/apply-speaker-orientation";

const parsed = parseRoom(shoebox);
if (!parsed.ok) throw new Error("la fixture del recinto no parsea");
const BASE: RoomDocument = parsed.data;

const SIMULATED = {
  position: [5, 2, 3] as [number, number, number],
  rotationDeg: { yaw: 10, pitch: 0, roll: 4 },
};
const PROPOSED = { yawDeg: 22, pitchDeg: -14 };

function withSpeaker(document: RoomDocument): RoomDocument {
  return {
    ...document,
    speakers: [
      {
        nodeId: "spk_1",
        position: [1, 2, 3],
        rotationDeg: { yaw: 0, pitch: 0, roll: 7 },
      },
      {
        nodeId: "spk_2",
        position: [9, 2, 3],
        rotationDeg: { yaw: 90, pitch: 1, roll: 0 },
      },
    ],
  };
}

describe("applySpeakerOrientation", () => {
  it("escribe yaw y pitch y deja la posición y el roll como estaban", () => {
    const next = applySpeakerOrientation(
      withSpeaker(BASE),
      "spk_1",
      PROPOSED,
      SIMULATED,
    );
    const speaker = next.speakers.find((item) => item.nodeId === "spk_1");

    expect(speaker?.rotationDeg).toEqual({ yaw: 22, pitch: -14, roll: 7 });
    expect(speaker?.position).toEqual([1, 2, 3]);
  });

  it("no toca las demás cajas", () => {
    const before = withSpeaker(BASE);
    const next = applySpeakerOrientation(before, "spk_1", PROPOSED, SIMULATED);

    expect(next.speakers.find((item) => item.nodeId === "spk_2")).toEqual(
      before.speakers[1],
    );
  });

  it("materializa la colocación con la que simuló el motor si la caja nunca se movió", () => {
    const next = applySpeakerOrientation(BASE, "spk_9", PROPOSED, SIMULATED);
    const speaker = next.speakers.find((item) => item.nodeId === "spk_9");

    expect(BASE.speakers).toHaveLength(0);
    expect(next.speakers).toHaveLength(1);
    // La posición es la que el motor tenía delante; el roll también, porque la regla no lo propone.
    expect(speaker?.position).toEqual(SIMULATED.position);
    expect(speaker?.rotationDeg).toEqual({ yaw: 22, pitch: -14, roll: 4 });
  });

  it("no muta el documento de entrada", () => {
    const before = withSpeaker(BASE);
    const snapshot = structuredClone(before);

    applySpeakerOrientation(before, "spk_1", PROPOSED, SIMULATED);

    expect(before).toEqual(snapshot);
  });

  it("lo que sale sigue siendo un RoomDocument válido", () => {
    const next = applySpeakerOrientation(BASE, "spk_9", PROPOSED, SIMULATED);

    expect(parseRoom(next).ok).toBe(true);
  });
});

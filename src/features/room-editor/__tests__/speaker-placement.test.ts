// src/features/room-editor/__tests__/speaker-placement.test.ts — la colocación de las cajas: el
// defecto calculado al vuelo, los comandos que lo persisten y el aviso de "fuera del recinto".

import { describe, expect, it } from "vitest";
import {
  audienceZone,
  buildRoom,
  catalogWith,
  rectVertices,
} from "@/features/room-editor/__tests__/fixtures/room-builder";
import { applyRoomCommand } from "@/features/room-editor/history/apply-room-command";
import {
  defaultSpeakerPlacement,
  isSpeakerPlaced,
  resolveSpeakerPlacements,
} from "@/features/room-editor/model/speaker-placement";
import { EMPTY_ROOM } from "@/features/room-editor/schemas/room-document";
import { validateRoom } from "@/features/room-editor/validation/validate-room";

const room = () =>
  buildRoom(
    { kind: "setFootprint", vertices: rectVertices(20, 12) },
    { kind: "setHeight", heightM: 6 },
    {
      kind: "insertAudienceZone",
      index: 0,
      zone: audienceZone("zone_1", rectVertices(16, 10)),
    },
  );

const placement = (nodeId: string, position: [number, number, number]) => ({
  nodeId,
  position,
  rotationDeg: { yaw: 0, pitch: 0, roll: 0 },
});

describe("colocación por defecto", () => {
  it("reparte las cajas por el frente sin encimarlas ni mandarlas a las esquinas", () => {
    const [left, right] = resolveSpeakerPlacements(room(), ["spk_a", "spk_b"]);

    // Ancho 20 repartido en los huecos interiores: 1/3 y 2/3.
    expect(left.position[0]).toBeCloseTo(20 / 3, 6);
    expect(right.position[0]).toBeCloseTo(40 / 3, 6);
    expect(left.position[0]).not.toBeCloseTo(right.position[0], 6);
  });

  it("cuelga la caja a altura de vuelo sin atravesar el techo de una sala baja", () => {
    const tall = resolveSpeakerPlacements(room(), ["spk_a"])[0];
    expect(tall.position[2]).toBe(3);

    const low = buildRoom(
      { kind: "setFootprint", vertices: rectVertices(20, 12) },
      { kind: "setHeight", heightM: 2.4 },
    );
    const placed = resolveSpeakerPlacements(low, ["spk_a"])[0];
    expect(placed.position[2]).toBeLessThan(2.4);
  });

  it("apunta hacia el centro de la planta", () => {
    // Caja a la izquierda del centro (x=20/3 < 10) mirando al centroide: yaw en (-90, 90).
    const [left] = resolveSpeakerPlacements(room(), ["spk_a", "spk_b"]);
    expect(Math.abs(left.rotationDeg.yaw)).toBeLessThan(90);
  });

  it("es determinista: dos llamadas dan exactamente lo mismo", () => {
    const first = resolveSpeakerPlacements(room(), ["spk_a", "spk_b"]);
    const second = resolveSpeakerPlacements(room(), ["spk_a", "spk_b"]);
    expect(first).toEqual(second);
  });

  it("no revienta con una sala todavía sin planta", () => {
    expect(defaultSpeakerPlacement(EMPTY_ROOM, "spk_a", 0, 1).position).toEqual(
      [0, 0, 0],
    );
  });
});

describe("resolveSpeakerPlacements", () => {
  it("prefiere la colocación guardada y completa el resto", () => {
    const document = applyRoomCommand(room(), {
      kind: "setSpeakerPlacement",
      speaker: placement("spk_b", [1, 2, 3]),
    })?.next;
    if (!document) throw new Error("El comando no tuvo efecto");

    const [a, b] = resolveSpeakerPlacements(document, ["spk_a", "spk_b"]);
    expect(b.position).toEqual([1, 2, 3]);
    expect(a.position).not.toEqual([1, 2, 3]);
    expect(isSpeakerPlaced(document, "spk_a")).toBe(false);
    expect(isSpeakerPlaced(document, "spk_b")).toBe(true);
  });

  it("ignora las colocaciones cuyo nodo ya no está en el grafo", () => {
    const document = applyRoomCommand(room(), {
      kind: "setSpeakerPlacement",
      speaker: placement("spk_borrado", [1, 2, 3]),
    })?.next;
    if (!document) throw new Error("El comando no tuvo efecto");

    expect(resolveSpeakerPlacements(document, ["spk_a"])).toHaveLength(1);
    expect(resolveSpeakerPlacements(document, ["spk_a"])[0].nodeId).toBe(
      "spk_a",
    );
  });
});

describe("comandos de colocación", () => {
  it("la primera colocación se deshace quitándola, no moviéndola", () => {
    const result = applyRoomCommand(room(), {
      kind: "setSpeakerPlacement",
      speaker: placement("spk_a", [1, 2, 3]),
    });
    expect(result?.inverse).toEqual({
      kind: "removeSpeakerPlacement",
      nodeId: "spk_a",
    });
  });

  it("recolocar se deshace restaurando la posición anterior", () => {
    const placed = applyRoomCommand(room(), {
      kind: "setSpeakerPlacement",
      speaker: placement("spk_a", [1, 2, 3]),
    })?.next;
    if (!placed) throw new Error("El comando no tuvo efecto");

    const moved = applyRoomCommand(placed, {
      kind: "setSpeakerPlacement",
      speaker: placement("spk_a", [9, 9, 2]),
    });
    expect(moved?.next.speakers).toHaveLength(1);
    expect(moved?.inverse).toEqual({
      kind: "setSpeakerPlacement",
      speaker: placement("spk_a", [1, 2, 3]),
    });
  });

  it("quitar una colocación que no existe no tiene efecto", () => {
    expect(
      applyRoomCommand(room(), {
        kind: "removeSpeakerPlacement",
        nodeId: "spk_a",
      }),
    ).toBeNull();
  });
});

describe("validación", () => {
  const validate = (document: Parameters<typeof validateRoom>[0]) =>
    validateRoom(document, catalogWith());

  it("avisa de una caja fuera de la planta sin bloquear ROOM_READY", () => {
    const document = applyRoomCommand(room(), {
      kind: "setSpeakerPlacement",
      speaker: placement("spk_a", [50, 50, 2]),
    })?.next;
    if (!document) throw new Error("El comando no tuvo efecto");

    const validation = validate(document);
    expect(validation.warnings.map((w) => w.code)).toContain(
      "SPEAKER_OUTSIDE_ROOM",
    );
    expect(validation.errors).toEqual([]);
    expect(validation.isComplete).toBe(true);
  });

  it("avisa de una caja por encima del techo", () => {
    const document = applyRoomCommand(room(), {
      kind: "setSpeakerPlacement",
      speaker: placement("spk_a", [10, 6, 6.5]),
    })?.next;
    if (!document) throw new Error("El comando no tuvo efecto");

    expect(validate(document).warnings.map((w) => w.code)).toContain(
      "SPEAKER_OUTSIDE_ROOM",
    );
  });

  it("no avisa de una caja colgada justo del techo ni apoyada en el piso", () => {
    const document = applyRoomCommand(room(), {
      kind: "setSpeakerPlacement",
      speaker: placement("spk_a", [10, 6, 6]),
    })?.next;
    if (!document) throw new Error("El comando no tuvo efecto");

    expect(validate(document).warnings.map((w) => w.code)).not.toContain(
      "SPEAKER_OUTSIDE_ROOM",
    );
  });
});

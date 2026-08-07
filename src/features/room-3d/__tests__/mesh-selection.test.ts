// src/features/room-3d/__tests__/mesh-selection.test.ts — ida y vuelta de cada variante de
// RoomSelection a través del nombre de malla, sin WebGL de por medio.

import { describe, expect, it } from "vitest";
import {
  decodeMeshName,
  encodeMeshName,
} from "@/features/room-3d/model/mesh-selection";
import type { RoomSelection } from "@/features/room-editor/store/room-selection";

const SELECTIONS: RoomSelection[] = [
  { kind: "surface", id: "wall_2" },
  { kind: "obstacle", id: "p1" },
  { kind: "opening", id: "w1" },
  { kind: "zone", id: "zone_1" },
  { kind: "vertex", index: 3 },
];

describe("encodeMeshName / decodeMeshName", () => {
  it.each(SELECTIONS)("hace ida y vuelta con %o", (selection) => {
    expect(decodeMeshName(encodeMeshName(selection))).toEqual(selection);
  });

  it("rechaza nombres sin separador", () => {
    expect(decodeMeshName("wall_2")).toBeNull();
  });

  it("rechaza un tipo de selección desconocido", () => {
    expect(decodeMeshName("gizmo:speaker_1")).toBeNull();
  });

  it("rechaza un índice de vértice no numérico", () => {
    expect(decodeMeshName("vertex:abc")).toBeNull();
  });
});

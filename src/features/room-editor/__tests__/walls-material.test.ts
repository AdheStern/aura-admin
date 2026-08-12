// src/features/room-editor/__tests__/walls-material.test.ts — el material de todos los muros a la
// vez.
//
// Lo que se vigila es que sea UN paso de historial y no uno por muro: si se implementara encadenando
// `setSurfaceMaterial`, deshacer devolvería los muros de uno en uno y el usuario tendría que pulsar
// Ctrl+Z tantas veces como lados tenga la planta.

import { describe, expect, it } from "vitest";
import {
  buildRoom,
  rectVertices,
} from "@/features/room-editor/__tests__/fixtures/room-builder";
import type { RoomDocument } from "@/features/room-editor/schemas/room-document";
import { createRoomStore } from "@/features/room-editor/store/room-store";
import { validateRoom } from "@/features/room-editor/validation/validate-room";

const MATERIALS = { materialIds: new Set(["mat_brick", "mat_wood"]) };

function storeWith(document: RoomDocument) {
  return createRoomStore({
    sceneId: "scene_1",
    canManage: true,
    document,
    materialOptions: [],
    materialIds: MATERIALS.materialIds,
    sceneStatus: "FLOW_READY",
    validation: validateRoom(document, MATERIALS),
  });
}

const ROOM = buildRoom({ kind: "setFootprint", vertices: rectVertices(10, 8) });

const wallsOf = (document: RoomDocument) =>
  document.surfaces.filter((surface) => surface.type === "wall");

describe("setWallsMaterial", () => {
  it("asigna el material a los cuatro muros y no toca piso ni techo", () => {
    const store = storeWith(ROOM);
    store.getState().setWallsMaterial("mat_brick");
    const { document } = store.getState();

    expect(wallsOf(document)).toHaveLength(4);
    expect(
      wallsOf(document).every((wall) => wall.materialId === "mat_brick"),
    ).toBe(true);
    expect(
      document.surfaces
        .filter((surface) => surface.type !== "wall")
        .every((surface) => surface.materialId === null),
    ).toBe(true);
  });

  it("un solo Ctrl+Z devuelve los cuatro", () => {
    const store = storeWith(ROOM);
    store.getState().setWallsMaterial("mat_brick");
    store.getState().undo();

    expect(
      wallsOf(store.getState().document).every(
        (wall) => wall.materialId === null,
      ),
    ).toBe(true);
  });

  it("elegir lo que ya estaba puesto no ensucia el historial", () => {
    const store = storeWith(ROOM);
    store.getState().setWallsMaterial("mat_brick");
    store.getState().setWallsMaterial("mat_brick");
    store.getState().undo();

    // Si el segundo hubiera entrado igualmente, este undo lo desharía a él y los muros seguirían
    // con material — y harían falta dos para volver al estado inicial.
    expect(
      wallsOf(store.getState().document).every(
        (wall) => wall.materialId === null,
      ),
    ).toBe(true);
  });

  it("iguala muros que tenían materiales distintos", () => {
    const store = storeWith(ROOM);
    const [first] = wallsOf(ROOM);
    store.getState().setSurfaceMaterial(first.id, "mat_wood");
    store.getState().setWallsMaterial("mat_brick");

    expect(
      wallsOf(store.getState().document).every(
        (wall) => wall.materialId === "mat_brick",
      ),
    ).toBe(true);
  });
});

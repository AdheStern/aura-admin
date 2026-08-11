// src/features/room-editor/__tests__/delete-selection.test.ts — el borrado por selección, que ahora
// tiene tres puertas de entrada (botón del panel, goma de borrar, tecla Supr) y una sola
// implementación. Lo que se vigila aquí es el enrutado por tipo y el mínimo de vértices: ese guardia
// vivía en el `disabled` de un botón y, al abrir las otras dos puertas, tuvo que bajar al store —
// si se cayera, una planta triangular podría quedarse en dos vértices y romper el contrato.

import { describe, expect, it } from "vitest";
import {
  audienceZone,
  buildRoom,
  rectPillar,
  rectVertices,
  wallIds,
  windowOpening,
} from "@/features/room-editor/__tests__/fixtures/room-builder";
import type { RoomDocument } from "@/features/room-editor/schemas/room-document";
import { createRoomStore } from "@/features/room-editor/store/room-store";
import { validateRoom } from "@/features/room-editor/validation/validate-room";

const NO_MATERIALS = { materialIds: new Set<string>() };

function storeWith(document: RoomDocument) {
  return createRoomStore({
    sceneId: "scene_1",
    canManage: true,
    document,
    materialOptions: [],
    materialIds: NO_MATERIALS.materialIds,
    sceneStatus: "FLOW_READY",
    validation: validateRoom(document, NO_MATERIALS),
  });
}

const SQUARE = buildRoom({
  kind: "setFootprint",
  vertices: rectVertices(10, 10),
});

describe("deleteSelection", () => {
  it("no hace nada sin selección", () => {
    const store = storeWith(SQUARE);
    store.getState().deleteSelection();
    expect(store.getState().document).toEqual(SQUARE);
  });

  it("borra el pilar seleccionado", () => {
    const store = storeWith(
      buildRoom(
        { kind: "setFootprint", vertices: rectVertices(10, 10) },
        {
          kind: "insertObstacle",
          index: 0,
          obstacle: rectPillar("p1", [5, 5]),
        },
      ),
    );

    store.getState().select({ kind: "obstacle", id: "p1" });
    store.getState().deleteSelection();

    expect(store.getState().document.obstacles).toEqual([]);
    expect(store.getState().selection).toBeNull();
  });

  it("borra la abertura seleccionada", () => {
    const document = buildRoom({
      kind: "setFootprint",
      vertices: rectVertices(10, 10),
    });
    const store = storeWith(document);
    const surfaceId = wallIds(document)[0];

    store.getState().runCommand({
      kind: "insertOpening",
      index: 0,
      opening: windowOpening("w1", surfaceId),
    });
    store.getState().select({ kind: "opening", id: "w1" });
    store.getState().deleteSelection();

    expect(store.getState().document.openings).toEqual([]);
  });

  it("borra la zona seleccionada", () => {
    const store = storeWith(
      buildRoom(
        { kind: "setFootprint", vertices: rectVertices(10, 10) },
        {
          kind: "insertAudienceZone",
          index: 0,
          zone: audienceZone("z1", rectVertices(8, 8)),
        },
      ),
    );

    store.getState().select({ kind: "zone", id: "z1" });
    store.getState().deleteSelection();

    expect(store.getState().document.zones.audience).toEqual([]);
  });

  it("deja el muro en paz: no se borra suelto, sale de la planta", () => {
    const store = storeWith(SQUARE);
    const surfaceId = wallIds(SQUARE)[0];

    store.getState().select({ kind: "surface", id: surfaceId });
    store.getState().deleteSelection();

    expect(store.getState().document).toEqual(SQUARE);
  });
});

describe("mínimo de vértices al borrar", () => {
  it("quita un vértice de un cuadrado y lo deja en triángulo", () => {
    const store = storeWith(SQUARE);

    store.getState().select({ kind: "vertex", index: 0 });
    store.getState().deleteSelection();

    expect(store.getState().document.footprint.vertices).toHaveLength(3);
  });

  it("se niega a bajar el triángulo a dos vértices", () => {
    const triangle = buildRoom({
      kind: "setFootprint",
      vertices: [
        [0, 0],
        [10, 0],
        [5, 8],
      ],
    });
    const store = storeWith(triangle);

    store.getState().select({ kind: "vertex", index: 0 });
    store.getState().deleteSelection();

    expect(store.getState().document.footprint.vertices).toHaveLength(3);
    // Y sin gastar una entrada de historial en un no-op.
    expect(store.getState().history.past).toHaveLength(0);
  });
});

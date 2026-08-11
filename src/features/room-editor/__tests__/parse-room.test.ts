// src/features/room-editor/__tests__/parse-room.test.ts — la lectura de Scene.room.
// La trampa que cubre la primera prueba: Prisma crea la columna con `{}`, que no es un documento
// corrupto sino una escena recién creada. Confundir las dos cosas dejaría al usuario ante un 404
// al abrir el editor de una escena que nunca dibujó.

import { describe, expect, it } from "vitest";
import { canonRoom } from "@/features/room-editor/__tests__/fixtures/room-builder";
import { parseRoom } from "@/features/room-editor/schemas/parse-room";
import {
  EMPTY_ROOM,
  roomDocumentSchema,
} from "@/features/room-editor/schemas/room-document";

describe("parseRoom", () => {
  it("traduce el objeto vacío de Prisma al documento vacío", () => {
    expect(parseRoom({})).toEqual({ ok: true, data: EMPTY_ROOM });
  });

  it("acepta un documento que salió del editor", () => {
    const document = canonRoom();
    expect(parseRoom(document)).toEqual({ ok: true, data: document });
  });

  it("rechaza el estado de la herramienta guardado por error", () => {
    const result = parseRoom({ ...canonRoom(), selectedVertex: 2 });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.message).toContain("selectedVertex");
  });

  it("señala el campo que falla con su ruta", () => {
    const result = parseRoom({
      ...canonRoom(),
      height: { type: "gable", h: 6 },
    });

    expect(result.ok === false && result.message).toContain("height.type");
  });
});

describe("documento vacío", () => {
  it("satisface su propio schema y no tiene muros hasta que se dibuja la planta", () => {
    expect(roomDocumentSchema.safeParse(EMPTY_ROOM).success).toBe(true);
    expect(EMPTY_ROOM.surfaces.every((s) => s.type !== "wall")).toBe(true);
  });
});

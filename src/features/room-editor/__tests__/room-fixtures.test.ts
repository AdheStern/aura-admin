// src/features/room-editor/__tests__/room-fixtures.test.ts — las cuatro salas de fixtures/*.json
// contra el pipeline completo: si un cambio en el dominio (Tarea 1) o en el compilador rompe
// alguna, es exactamente el mismo tipo de regresión que canon-01.test.ts vigila para los contratos.
//
// materialId es null en las cuatro (ver fixtures/README.md), así que el catálogo de materiales que
// recibe validateRoom no necesita contener nada real — un Set vacío es el catálogo correcto aquí.

import { describe, expect, it } from "vitest";
import { roomGeometrySchema } from "@/contracts/room-geometry.schema";
import lShapedRoom from "@/features/room-editor/fixtures/l-shaped-room.json";
import roomWithPillarsAndOpenings from "@/features/room-editor/fixtures/room-with-pillars-and-openings.json";
import shoeboxSmall from "@/features/room-editor/fixtures/shoebox-small.json";
import shoeboxWithStage from "@/features/room-editor/fixtures/shoebox-with-stage.json";
import { toRoomGeometry } from "@/features/room-editor/model/to-room-geometry";
import { parseRoom } from "@/features/room-editor/schemas/parse-room";
import { validateRoom } from "@/features/room-editor/validation/validate-room";

const NO_MATERIALS = { materialIds: new Set<string>() };
const DEFAULT_MATERIAL_ID = "mat_default";

const FIXTURES = {
  "shoebox-small": shoeboxSmall,
  "shoebox-with-stage": shoeboxWithStage,
  "l-shaped-room": lShapedRoom,
  "room-with-pillars-and-openings": roomWithPillarsAndOpenings,
};

describe.each(Object.entries(FIXTURES))("%s", (_name, raw) => {
  it("parsea como RoomDocument", () => {
    expect(parseRoom(raw)).toMatchObject({ ok: true });
  });

  it("no tiene errores, solo el aviso de materiales sin asignar", () => {
    const parsed = parseRoom(raw);
    if (!parsed.ok) throw new Error(parsed.message);

    const validation = validateRoom(parsed.data, NO_MATERIALS);
    expect(validation.errors).toEqual([]);
    expect(validation.isComplete).toBe(true);
    expect(validation.warnings.map((w) => w.code)).toContain(
      "MATERIAL_NOT_ASSIGNED",
    );
  });

  it("compila a un RoomGeometry que satisface el contrato v1", () => {
    const parsed = parseRoom(raw);
    if (!parsed.ok) throw new Error(parsed.message);

    const geometry = toRoomGeometry(parsed.data, {
      defaultMaterialId: DEFAULT_MATERIAL_ID,
    });
    const result = roomGeometrySchema.safeParse(geometry);
    expect(result.success).toBe(true);
    // Todo material salió null en la fixture: el compilador tiene que haber rellenado el defecto,
    // no dejar huecos que el contrato (materialId obligatorio) rechazaría.
    expect(
      geometry.surfaces.every((s) => s.materialId === DEFAULT_MATERIAL_ID),
    ).toBe(true);
  });
});

it("room-with-pillars-and-openings avisa de los dos pilares dentro de la audiencia", () => {
  const parsed = parseRoom(roomWithPillarsAndOpenings);
  if (!parsed.ok) throw new Error(parsed.message);

  const validation = validateRoom(parsed.data, NO_MATERIALS);
  const overAudience = validation.warnings.filter(
    (w) => w.code === "OBSTACLE_OVER_AUDIENCE",
  );
  expect(overAudience).toHaveLength(2);
});

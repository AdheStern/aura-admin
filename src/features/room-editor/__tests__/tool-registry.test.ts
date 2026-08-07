// src/features/room-editor/__tests__/tool-registry.test.ts — que la tira lateral y el registro no
// se desincronicen. Es el único modo de fallo de TOOL_GROUPS que no se ve: una herramienta que no
// esté en ningún grupo sigue funcionando, sigue teniendo icono (TOOL_ICONS es un Record completo,
// eso ya lo exige el tipo) y compila — simplemente no hay forma de elegirla desde la UI.

import { describe, expect, it } from "vitest";
import {
  ROOM_TOOLS,
  TOOL_GROUPS,
} from "@/features/room-editor/tools/tool-registry";
import type { RoomToolKind } from "@/features/room-editor/tools/tool-types";

describe("TOOL_GROUPS", () => {
  it("reparte cada herramienta del registro en exactamente una ranura", () => {
    const inGroups = TOOL_GROUPS.flatMap((group) => group.tools);
    const inRegistry = Object.keys(ROOM_TOOLS) as RoomToolKind[];

    // Ordenados y comparados enteros: pilla a la vez la que falta y la repetida (que alargaría la
    // lista), sin necesitar dos aserciones que puedan quedar desparejadas.
    expect([...inGroups].sort()).toEqual([...inRegistry].sort());
  });

  it("no deja ninguna ranura vacía", () => {
    for (const group of TOOL_GROUPS) {
      expect(group.tools.length).toBeGreaterThan(0);
    }
  });
});

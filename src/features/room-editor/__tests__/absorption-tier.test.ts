// src/features/room-editor/__tests__/absorption-tier.test.ts

import { describe, expect, it } from "vitest";
import {
  ABSORBENT_FROM,
  absorptionTier,
  REFLECTIVE_BELOW,
} from "@/features/room-editor/model/absorption-tier";

describe("absorptionTier", () => {
  it("una pared dura es reflectante", () => {
    // Hormigón, yeso y madera viven aquí abajo.
    expect(absorptionTier(0)).toBe("reflective");
    expect(absorptionTier(0.05)).toBe("reflective");
  });

  it("los cortes son cerrados por abajo: el valor límite ya es del tramo de arriba", () => {
    expect(absorptionTier(REFLECTIVE_BELOW - 0.001)).toBe("reflective");
    expect(absorptionTier(REFLECTIVE_BELOW)).toBe("mixed");
    expect(absorptionTier(ABSORBENT_FROM - 0.001)).toBe("mixed");
    expect(absorptionTier(ABSORBENT_FROM)).toBe("absorbent");
  });

  it("un tratamiento absorbente llega arriba del todo", () => {
    expect(absorptionTier(0.85)).toBe("absorbent");
    expect(absorptionTier(1)).toBe("absorbent");
  });
});

// src/features/room-3d/__tests__/coverage-cone.test.ts

import { describe, expect, it } from "vitest";
import type { SpeakerSpec } from "@/contracts/speaker-spec.schema";
import {
  coneThrowM,
  coverageCone,
  isOmnidirectional,
} from "@/features/room-3d/model/coverage-cone";
import { rectVertices } from "@/features/room-editor/__tests__/fixtures/room-builder";

const specWith = (hDeg: number, vDeg: number) =>
  ({
    directivity: { nominalCoverage: { hDeg, vDeg }, diByBand: {} },
  }) as unknown as SpeakerSpec;

describe("coverageCone", () => {
  it("usa la MITAD de la cobertura nominal: es el ángulo total a −6 dB", () => {
    // 90° totales → semiángulo 45° → radio = distancia (tan 45 = 1).
    const cone = coverageCone(specWith(90, 90), 10);
    expect(cone?.horizontalRadiusM).toBeCloseTo(10, 6);
  });

  it("la sección es elíptica cuando H y V difieren", () => {
    const cone = coverageCone(specWith(90, 60), 10);
    expect(cone?.horizontalRadiusM).toBeGreaterThan(
      cone?.verticalRadiusM as number,
    );
    expect(cone?.verticalRadiusM).toBeCloseTo(10 * Math.tan(Math.PI / 6), 6);
  });

  it("no dibuja cono sin datasheet en vez de inventar un ángulo", () => {
    expect(coverageCone(null, 10)).toBeNull();
  });

  it("no dibuja cono para una caja omnidireccional, como un subgrave de 360°", () => {
    // El catálogo trae varios subgraves declarados 360°×360°: no tienen lóbulo que representar.
    expect(coverageCone(specWith(360, 360), 10)).toBeNull();
    expect(coverageCone(specWith(180, 180), 10)).toBeNull();
    expect(isOmnidirectional(specWith(360, 360))).toBe(true);
    expect(isOmnidirectional(specWith(90, 60))).toBe(false);
  });

  it("una cobertura estrecha en un plano sigue dando cono", () => {
    // 100°×10° es un line array del catálogo: direccionalísimo en vertical.
    const cone = coverageCone(specWith(100, 10), 10);
    expect(cone?.verticalRadiusM).toBeLessThan(1);
    expect(cone?.horizontalRadiusM).toBeGreaterThan(10);
  });
});

describe("coneThrowM", () => {
  it("llega a la esquina más lejana de la planta", () => {
    // Caja en una esquina de una sala 20x12: la diagonal es la esquina opuesta.
    expect(coneThrowM([0, 0], rectVertices(20, 12))).toBeCloseTo(
      Math.hypot(20, 12),
      6,
    );
  });

  it("tiene un mínimo para que el cono se vea aunque no haya planta", () => {
    expect(coneThrowM([0, 0], [])).toBeGreaterThan(0);
  });
});

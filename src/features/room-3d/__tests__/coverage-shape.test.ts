// src/features/room-3d/__tests__/coverage-shape.test.ts

import { describe, expect, it } from "vitest";
import type { SpeakerSpec } from "@/contracts/speaker-spec.schema";
import {
  coverageReachM,
  coverageShape,
  isOmnidirectional,
} from "@/features/room-3d/model/coverage-shape";
import { rectVertices } from "@/features/room-editor/__tests__/fixtures/room-builder";

const specWith = (hDeg: number, vDeg: number) =>
  ({
    directivity: { nominalCoverage: { hDeg, vDeg }, diByBand: {} },
  }) as unknown as SpeakerSpec;

describe("coverageShape", () => {
  it("usa la MITAD de la cobertura nominal: es el ángulo total a −6 dB", () => {
    // 90° totales → semiángulo 45° → radio = distancia (tan 45 = 1).
    const shape = coverageShape(specWith(90, 90), 10);
    if (shape?.kind !== "cone") throw new Error("esperaba un cono");

    expect(shape.horizontalRadiusM).toBeCloseTo(10, 6);
  });

  it("la sección es elíptica cuando H y V difieren", () => {
    const shape = coverageShape(specWith(90, 60), 10);
    if (shape?.kind !== "cone") throw new Error("esperaba un cono");

    expect(shape.horizontalRadiusM).toBeGreaterThan(shape.verticalRadiusM);
    expect(shape.verticalRadiusM).toBeCloseTo(10 * Math.tan(Math.PI / 6), 6);
  });

  it("no dibuja nada sin datasheet en vez de inventar un ángulo", () => {
    expect(coverageShape(null, 10)).toBeNull();
  });

  it("una caja omnidireccional es una esfera, no un cono", () => {
    // El catálogo trae varios subgraves declarados 360°×360°: no tienen lóbulo que representar,
    // pero sí una forma de propagar, que es hacia todos lados por igual.
    expect(coverageShape(specWith(360, 360), 10)).toEqual({
      kind: "sphere",
      radiusM: 5,
    });
    expect(coverageShape(specWith(180, 180), 10)?.kind).toBe("sphere");
    expect(isOmnidirectional(specWith(360, 360))).toBe(true);
    expect(isOmnidirectional(specWith(90, 60))).toBe(false);
  });

  it("el diámetro de la esfera es el alcance, para leerse a la escala de los conos", () => {
    const shape = coverageShape(specWith(360, 360), 12);
    if (shape?.kind !== "sphere") throw new Error("esperaba una esfera");

    expect(shape.radiusM * 2).toBeCloseTo(12, 6);
  });

  it("una cobertura estrecha en un plano sigue dando cono", () => {
    // 100°×10° es un line array del catálogo: direccionalísimo en vertical.
    const shape = coverageShape(specWith(100, 10), 10);
    if (shape?.kind !== "cone") throw new Error("esperaba un cono");

    expect(shape.verticalRadiusM).toBeLessThan(1);
    expect(shape.horizontalRadiusM).toBeGreaterThan(10);
  });
});

describe("coverageReachM", () => {
  it("llega a media sala: la mitad de la esquina más lejana de la planta", () => {
    // Caja en una esquina de una sala 20x12: la esquina opuesta está en la diagonal.
    expect(coverageReachM([0, 0], rectVertices(20, 12))).toBeCloseTo(
      Math.hypot(20, 12) / 2,
      6,
    );
  });

  it("tiene un mínimo para que la forma se vea aunque no haya planta", () => {
    expect(coverageReachM([0, 0], [])).toBeGreaterThan(0);
  });
});

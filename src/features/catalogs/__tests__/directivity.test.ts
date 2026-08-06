// src/features/catalogs/__tests__/directivity.test.ts — los diagramas polares son modelos, así que
// lo que se prueba son las propiedades que los definen: dónde vale 1, dónde vale 0 y dónde cae los
// −6 dB que dan nombre a la cobertura.

import { describe, expect, it } from "vitest";
import {
  microphonePolarPattern,
  type PolarSample,
  speakerCoveragePattern,
} from "@/features/catalogs/directivity";

function at(samples: PolarSample[], angleDeg: number): number {
  const sample = samples.find((current) => current.angleDeg === angleDeg);
  if (!sample) throw new Error(`No hay muestra a ${angleDeg}°`);
  return sample.magnitude;
}

describe("microphonePolarPattern", () => {
  it("el omnidireccional vale lo mismo en todas las direcciones", () => {
    const samples = microphonePolarPattern("omnidirectional");

    expect(samples.every((sample) => sample.magnitude === 1)).toBe(true);
  });

  it("el cardioide capta de frente y cancela justo por detrás", () => {
    const samples = microphonePolarPattern("cardioid");

    expect(at(samples, 0)).toBe(1);
    expect(at(samples, 90)).toBeCloseTo(0.5, 3);
    expect(at(samples, 180)).toBe(0);
  });

  it("el figura-8 cancela a los lados y capta igual por delante y por detrás", () => {
    const samples = microphonePolarPattern("figure_8");

    expect(at(samples, 0)).toBe(1);
    expect(at(samples, 90)).toBe(0);
    expect(at(samples, 180)).toBe(1);
  });

  it("el hipercardioide tiene lóbulo trasero: capta algo a 180°, a diferencia del cardioide", () => {
    const hyper = microphonePolarPattern("hypercardioid");

    // r(180°) = 0.25 − 0.75 = −0.5 → magnitud 0.5.
    expect(at(hyper, 180)).toBeCloseTo(0.5, 3);
    expect(at(microphonePolarPattern("cardioid"), 180)).toBe(0);
  });

  it("todos los patrones están normalizados: nunca superan 1 y valen 1 en el eje", () => {
    const patterns = [
      "omnidirectional",
      "cardioid",
      "supercardioid",
      "hypercardioid",
      "figure_8",
      "shotgun",
    ] as const;

    for (const pattern of patterns) {
      const samples = microphonePolarPattern(pattern);
      expect(at(samples, 0)).toBe(1);
      expect(Math.max(...samples.map((s) => s.magnitude))).toBeLessThanOrEqual(
        1,
      );
    }
  });

  it("el cañón es más estrecho que el hipercardioide del que parte", () => {
    const shotgun = microphonePolarPattern("shotgun");
    const hyper = microphonePolarPattern("hypercardioid");

    expect(at(shotgun, 45)).toBeLessThan(at(hyper, 45));
  });
});

describe("speakerCoveragePattern", () => {
  it("la cobertura nominal es el ángulo TOTAL a −6 dB (Apéndice A.2)", () => {
    // A media cobertura, la atenuación es de 6 dB por construcción → 10^(-6/20) ≈ 0.501.
    for (const coverageDeg of [60, 90, 120]) {
      const samples = speakerCoveragePattern(coverageDeg);
      expect(at(samples, coverageDeg / 2)).toBeCloseTo(0.501, 2);
    }
  });

  it("vale 1 en el eje y decae al alejarse", () => {
    const samples = speakerCoveragePattern(90);

    expect(at(samples, 0)).toBe(1);
    expect(at(samples, 20)).toBeLessThan(1);
    expect(at(samples, 40)).toBeLessThan(at(samples, 20));
  });

  it("es simétrico: 350° es lo mismo que 10°, no un ángulo enorme fuera de eje", () => {
    const samples = speakerCoveragePattern(90);

    expect(at(samples, 350)).toBeCloseTo(at(samples, 10), 6);
  });

  it("una cobertura más ancha atenúa menos al mismo ángulo fuera de eje", () => {
    const ancha = speakerCoveragePattern(120);
    const estrecha = speakerCoveragePattern(60);

    expect(at(ancha, 30)).toBeGreaterThan(at(estrecha, 30));
  });

  it("la atenuación se topa en 20 dB y no cae a cero por detrás", () => {
    const samples = speakerCoveragePattern(60);

    // A_max = 20 dB → 10^(-20/20) = 0.1.
    expect(at(samples, 180)).toBeCloseTo(0.1, 3);
    expect(Math.min(...samples.map((s) => s.magnitude))).toBeCloseTo(0.1, 3);
  });
});

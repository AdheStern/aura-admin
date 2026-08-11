// src/features/room-3d/__tests__/speaker-orientation.test.ts — las convenciones de eje, que son
// exactamente lo que se rompe en silencio: una caja mal orientada sigue dibujándose y nadie lo nota
// hasta que el mapa de calor sale girado 90°.

import { describe, expect, it } from "vitest";
import {
  sceneAimDirection,
  toContractRotation,
  toSceneRotation,
} from "@/features/room-3d/model/speaker-orientation";

const rotation = (yaw: number, pitch = 0, roll = 0) => ({ yaw, pitch, roll });

describe("sceneAimDirection", () => {
  it("yaw 0 apunta a +x de la planta", () => {
    const [x, height, z] = sceneAimDirection(rotation(0));
    expect(x).toBeCloseTo(1, 6);
    expect(height).toBeCloseTo(0, 6);
    expect(z).toBeCloseTo(0, 6);
  });

  it("yaw 90 apunta a +y de la planta, que en la escena es +z", () => {
    const [x, , z] = sceneAimDirection(rotation(90));
    expect(x).toBeCloseTo(0, 6);
    expect(z).toBeCloseTo(1, 6);
  });

  it("pitch positivo levanta el morro", () => {
    const [, height] = sceneAimDirection(rotation(0, 30));
    expect(height).toBeCloseTo(0.5, 6);
  });

  it("el tiro hacia abajo de un refuerzo es pitch negativo", () => {
    expect(sceneAimDirection(rotation(0, -30))[1]).toBeLessThan(0);
  });

  it("siempre devuelve un vector unitario", () => {
    for (const angles of [
      rotation(0),
      rotation(37, 12),
      rotation(-120, -45),
      rotation(180, 89),
    ]) {
      const [x, y, z] = sceneAimDirection(angles);
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 6);
    }
  });
});

describe("toSceneRotation / toContractRotation", () => {
  it("niega el yaw, porque girar sobre +y lleva +x hacia −z", () => {
    const { euler, order } = toSceneRotation(rotation(90));
    expect(order).toBe("YZX");
    expect(euler[1]).toBeCloseTo(-Math.PI / 2, 6);
  });

  it("hace ida y vuelta sin perder nada", () => {
    for (const angles of [
      rotation(0),
      rotation(45, 10, -5),
      rotation(-133.7, 22.5, 180),
    ]) {
      const roundTripped = toContractRotation(toSceneRotation(angles).euler);
      expect(roundTripped.yaw).toBeCloseTo(angles.yaw, 6);
      expect(roundTripped.pitch).toBeCloseTo(angles.pitch, 6);
      expect(roundTripped.roll).toBeCloseTo(angles.roll, 6);
    }
  });
});

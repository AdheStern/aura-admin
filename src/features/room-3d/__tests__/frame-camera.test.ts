// src/features/room-3d/__tests__/frame-camera.test.ts

import { describe, expect, it } from "vitest";
import { frameCamera } from "@/features/room-3d/model/frame-camera";
import { rectVertices } from "@/features/room-editor/__tests__/fixtures/room-builder";

describe("frameCamera", () => {
  it("mira al centro de la planta, a media altura", () => {
    const frame = frameCamera(rectVertices(20, 12), 6);
    expect(frame.targetM).toEqual([10, 3, 6]);
  });

  it("el radio cubre la esquina más lejana del centro", () => {
    const frame = frameCamera(rectVertices(20, 12), 6);
    expect(frame.radiusM).toBeCloseTo(Math.hypot(10, 6), 6);
  });

  it("una sala sin footprint todavía da un encuadre por defecto razonable", () => {
    const frame = frameCamera([], 4);
    expect(frame.targetM).toEqual([0, 2, 0]);
    expect(frame.radiusM).toBeGreaterThan(0);
  });

  it("la posición inicial queda más lejos del target que el radio de la sala", () => {
    const frame = frameCamera(rectVertices(20, 12), 6);
    const [tx, ty, tz] = frame.targetM;
    const [px, py, pz] = frame.positionM;
    const distanceM = Math.hypot(px - tx, py - ty, pz - tz);

    // Si quedara a un radio o menos, la cámara arrancaría pegada a la esquina más cercana en vez de
    // encuadrar la sala completa.
    expect(distanceM).toBeGreaterThan(frame.radiusM);
    expect(py).toBeGreaterThan(ty);
  });
});

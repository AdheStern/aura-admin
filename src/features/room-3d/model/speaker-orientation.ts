// src/features/room-3d/model/speaker-orientation.ts — yaw/pitch/roll del contrato → rotación de
// three.js, y la dirección de tiro que resulta.
//
// Las tres convenciones que fija este módulo, porque el contrato declara los campos pero no su
// significado (rotationDeg son tres z.number() sin rango ni documentación):
//   · yaw  0° apunta a +x de la planta y crece hacia +y, igual que atan2(dy, dx).
//   · pitch positivo levanta el morro; el tiro hacia abajo típico de un refuerzo es negativo.
//   · roll  gira sobre el eje de tiro, y solo importa cuando la cobertura no es simétrica (H≠V).
//
// TRAMPA: en el marco de three.js la planta es el plano XZ y girar sobre +y lleva +x hacia −z,
// mientras que en la planta del contrato yaw lleva +x hacia +y (que es +z en la escena). Por eso el
// yaw entra NEGADO. El orden "YZX" es el que compone yaw sobre la vertical del mundo, luego el
// cabeceo sobre el eje transversal y por último el alabeo sobre el propio eje de tiro; con el orden
// por defecto ("XYZ") el cabeceo se aplicaría antes del giro y una caja apuntada en diagonal
// acabaría inclinada de costado.

import type { ScenePoint } from "@/features/room-3d/model/scene-frame";
import type { RoomSpeaker } from "@/features/room-editor/schemas/room-document";

export type SceneRotation = {
  /** [x, y, z] en radianes, para un THREE.Euler con este mismo `order`. */
  euler: readonly [number, number, number];
  order: "YZX";
};

export function toSceneRotation({
  yaw,
  pitch,
  roll,
}: RoomSpeaker["rotationDeg"]): SceneRotation {
  return {
    euler: [toRadians(roll), -toRadians(yaw), toRadians(pitch)],
    order: "YZX",
  };
}

/** La vuelta, para lo que el gizmo de rotación reporta. */
export function toContractRotation(
  euler: readonly [number, number, number],
): RoomSpeaker["rotationDeg"] {
  const [roll, negatedYaw, pitch] = euler;
  return {
    yaw: toDegrees(-negatedYaw),
    pitch: toDegrees(pitch),
    roll: toDegrees(roll),
  };
}

/** Vector unitario de tiro en el marco de la escena. El eje local de la caja es +x. */
export function sceneAimDirection({
  yaw,
  pitch,
}: RoomSpeaker["rotationDeg"]): ScenePoint {
  const yawRad = toRadians(yaw);
  const pitchRad = toRadians(pitch);
  const horizontal = Math.cos(pitchRad);

  return [
    horizontal * Math.cos(yawRad),
    Math.sin(pitchRad),
    horizontal * Math.sin(yawRad),
  ];
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

// src/features/room-3d/components/speaker-baffle.tsx — la cara por la que sale el sonido.
//
// Una caja es un prisma gris: de frente y por detrás se ve idéntica, así que con la cámara
// orbitando no hay forma de saber si está apuntando a la audiencia o a la pared. El cono de
// cobertura lo dice, pero es tan translúcido a propósito (ver coverage-mesh.tsx) que desde
// muchos ángulos no se distingue, y desaparece del todo cuando la caja no trae datos de directividad.
//
// La chapa va sobre la cara +x, que es el eje de tiro local (ver speaker-orientation.ts).
//
// Conserva su color aunque la caja esté seleccionada: cuál es la elegida ya lo dice el cuerpo, y
// perder de vista hacia dónde tira mientras se la orienta sería perderlo justo cuando más falta hace.

"use client";

import { DoubleSide } from "three";

/** Ámbar: el único acento fuerte que no significa ya otra cosa en esta escena (azul = selección,
 *  verde = audiencia, violeta = escenario, grises = recinto). */
const BAFFLE_HEX = "#f59e0b";

/** Despegada de la cara para no pelear con ella por los mismos píxeles. */
const OFFSET_M = 0.003;

/** No captura clicks: el cuerpo que hay justo detrás es quien selecciona la caja, y desde delante
 *  el clic tiene que llegarle igual. */
const NO_RAYCAST = () => null;

export function SpeakerBaffle({
  depthM,
  heightM,
  widthM,
}: {
  depthM: number;
  heightM: number;
  widthM: number;
}) {
  return (
    <mesh
      position={[depthM / 2 + OFFSET_M, 0, 0]}
      // +90° sobre la vertical lleva la normal del plano de +z a +x, el eje de tiro.
      rotation={[0, Math.PI / 2, 0]}
      raycast={NO_RAYCAST}
    >
      <planeGeometry args={[widthM, heightM]} />
      <meshStandardMaterial color={BAFFLE_HEX} side={DoubleSide} />
    </mesh>
  );
}

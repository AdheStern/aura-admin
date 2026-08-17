// src/features/room-3d/components/floor-grid.tsx — la cuadrícula del suelo, la referencia de
// escala del editor 3D.
//
// Un metro por casilla y una línea marcada cada cinco, con los mismos grises que la cuadrícula del
// plano 2D. Sin ella la sala flota en un vacío sin tamaño: no hay forma de estimar a ojo a qué
// distancia queda una caja de la audiencia, que es justo lo que se viene a hacer aquí.
//
// Va por DEBAJO del piso y no a su misma cota: a la misma altura los dos planos pelean por el mismo
// píxel y la sala parpadea. Así la cuadrícula solo asoma alrededor del recinto.

"use client";

import { Grid } from "@react-three/drei";
import { DoubleSide } from "three";
import type { CanvasPalette } from "@/features/room-editor/model/canvas-palette";

/** Referencia visual, no geometría: un click la atraviesa. */
const NO_RAYCAST = () => null;

const BELOW_FLOOR_M = -0.005;

/** El desvanecido se mide en radios de sala para que una nave y un aula se vean igual de pobladas;
 *  el mínimo evita que en una sala diminuta la cuadrícula muera a dos metros del recinto. */
const FADE_RADII = 8;
const MIN_FADE_M = 60;

export function FloorGrid({
  palette,
  radiusM,
}: {
  palette: CanvasPalette;
  radiusM: number;
}) {
  return (
    <Grid
      position={[0, BELOW_FLOOR_M, 0]}
      infiniteGrid
      cellSize={1}
      cellThickness={0.6}
      cellColor={palette.gridMajor}
      sectionSize={5}
      sectionThickness={1.2}
      sectionColor={palette.obstacle}
      fadeDistance={Math.max(MIN_FADE_M, radiusM * FADE_RADII)}
      fadeStrength={1}
      followCamera={false}
      side={DoubleSide}
      raycast={NO_RAYCAST}
    />
  );
}

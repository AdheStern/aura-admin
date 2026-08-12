// src/features/room-3d/components/zone-meshes.tsx — dónde está el público y dónde el escenario.
//
// Mismos colores que el plano 2D (canvas-palette.ts) porque son las mismas zonas vistas desde otro
// sitio: verde la audiencia, violeta el escenario. Si cada vista eligiera su tono, el usuario
// tendría que aprender dos códigos para leer un solo documento.
//
// meshBasicMaterial y no standard: estas manchas no son superficies físicas del recinto, son una
// anotación. Sombrearlas con las luces cambiaría su tono según el ángulo, dejarían de casar con el
// 2D y se leerían como un material más de la sala.

"use client";

import { useMemo } from "react";
import { BufferGeometry, DoubleSide, Float32BufferAttribute } from "three";
import { triangleFanGeometry } from "@/features/room-3d/components/geometry-builders";
import {
  extrudeZones,
  type ZonePiece,
} from "@/features/room-3d/model/extrude-zones";
import type { ScenePoint } from "@/features/room-3d/model/scene-frame";
import type { CanvasPalette } from "@/features/room-editor/model/canvas-palette";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

/** Las zonas no se clican: el picking de superficies tiene que seguir llegando al piso de debajo. */
const NO_RAYCAST = () => null;

/** Bastante para separarse del piso, poco para no tapar el mapa de cobertura que va encima. */
const FILL_OPACITY = 0.38;

export function ZoneMeshes({ palette }: { palette: CanvasPalette }) {
  const document = useRoomStore((state) => state.document);
  const zones = useMemo(() => extrudeZones(document), [document]);

  return (
    <>
      {zones.stage ? (
        <ZoneVolume piece={zones.stage} color={palette.stageZoneStroke} />
      ) : null}
      {zones.audience.map((zone) => (
        <ZoneVolume
          key={zone.id}
          piece={zone}
          color={palette.audienceZoneStroke}
        />
      ))}
    </>
  );
}

function ZoneVolume({ piece, color }: { piece: ZonePiece; color: string }) {
  const fill = useMemo(
    () => triangleFanGeometry(piece.triangles),
    [piece.triangles],
  );
  const outline = useMemo(
    () => outlineGeometry(piece.outline),
    [piece.outline],
  );

  return (
    <>
      {/* `depthWrite` apagado para que dos zonas superpuestas se sumen en vez de recortarse: cuál
          quedó delante en el buffer de profundidad no significa nada aquí. */}
      <mesh geometry={fill} raycast={NO_RAYCAST}>
        <meshBasicMaterial
          color={color}
          side={DoubleSide}
          transparent
          opacity={FILL_OPACITY}
          depthWrite={false}
        />
      </mesh>
      <lineLoop geometry={outline} raycast={NO_RAYCAST}>
        <lineBasicMaterial color={color} />
      </lineLoop>
    </>
  );
}

function outlineGeometry(points: readonly ScenePoint[]): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(points.flat(), 3),
  );
  return geometry;
}

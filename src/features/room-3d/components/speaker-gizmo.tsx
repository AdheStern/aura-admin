// src/features/room-3d/components/speaker-gizmo.tsx — una caja en el recinto: su cuerpo, su cono
// de cobertura y, si está elegida, el gizmo de traslación o rotación de §5.3.
//
// El gizmo escribe DIRECTAMENTE sobre el objeto de three.js (así funciona TransformControls), así
// que la posición se lee de vuelta del grupo en cada cambio y se emite como comando. El comando
// funde por nodo (ver command-registry.ts), de modo que un arrastre entero es un solo "Deshacer".

"use client";

import { TransformControls } from "@react-three/drei";
import { type RefObject, useRef } from "react";
import type { Group, Object3D } from "three";
import { CoverageConeMesh } from "@/features/room-3d/components/coverage-cone-mesh";
import type { CoverageCone } from "@/features/room-3d/model/coverage-cone";
import { encodeMeshName } from "@/features/room-3d/model/mesh-selection";
import {
  type ScenePoint,
  toContractPosition,
} from "@/features/room-3d/model/scene-frame";
import {
  type SceneRotation,
  toContractRotation,
} from "@/features/room-3d/model/speaker-orientation";
import type { RoomSpeaker } from "@/features/room-editor/schemas/room-document";

/** Caja genérica cuando el nodo no tiene datasheet: se ve, pero no finge unas medidas concretas. */
const FALLBACK_BOX_M: [number, number, number] = [0.4, 0.5, 0.5];

export type GizmoMode = "translate" | "rotate";

export function SpeakerGizmo({
  nodeId,
  position,
  rotation,
  boxM,
  cone,
  color,
  isSelected,
  canManage,
  mode,
  onSelect,
  onPlace,
}: {
  nodeId: string;
  position: ScenePoint;
  rotation: SceneRotation;
  boxM: [number, number, number] | null;
  cone: CoverageCone | null;
  color: string;
  isSelected: boolean;
  canManage: boolean;
  mode: GizmoMode;
  onSelect: () => void;
  onPlace: (placement: Omit<RoomSpeaker, "nodeId">) => void;
}) {
  const groupRef = useRef<Group>(null);
  const [depthM, heightM, widthM] = boxM ?? FALLBACK_BOX_M;

  function handleObjectChange() {
    const group = groupRef.current;
    if (!group) return;

    onPlace({
      position: toContractPosition([
        group.position.x,
        group.position.y,
        group.position.z,
      ]),
      rotationDeg: toContractRotation([
        group.rotation.x,
        group.rotation.y,
        group.rotation.z,
      ]),
    });
  }

  return (
    <>
      <group
        ref={groupRef}
        position={[...position]}
        rotation={[...rotation.euler, rotation.order]}
      >
        {/* biome-ignore lint/a11y/noStaticElementInteractions: <mesh> es un nodo three.js, no DOM */}
        <mesh
          name={encodeMeshName({ kind: "speaker", id: nodeId })}
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
        >
          <boxGeometry args={[depthM, heightM, widthM]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {cone ? (
          <CoverageConeMesh cone={cone} color={color} isSelected={isSelected} />
        ) : null}
      </group>

      {isSelected && canManage ? (
        <TransformControls
          object={groupRef as RefObject<Object3D>}
          mode={mode}
          size={0.7}
          onObjectChange={handleObjectChange}
        />
      ) : null}
    </>
  );
}

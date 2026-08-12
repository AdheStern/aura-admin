// src/app/(app)/projects/[projectId]/scenes/[sceneId]/room/3d/page.tsx — editor 3D del recinto
// (Fase 4, Tarea 1): extrusión, cámara, picking de superficies y panel de materiales.

import { notFound, redirect } from "next/navigation";
import { Room3dEditor } from "@/features/room-3d/components/room-3d-editor";
import { listRoomMaterialColors } from "@/features/room-3d/queries/list-room-material-colors";
import { listSceneSpeakers } from "@/features/room-3d/queries/list-scene-speakers";
import { listRoomMaterialOptions } from "@/features/room-editor/queries/list-room-material-options";
import { parseRoom } from "@/features/room-editor/schemas/parse-room";
import { validateRoom } from "@/features/room-editor/validation/validate-room";
import { getSceneWithRole } from "@/features/scenes/queries";
import { getLatestSplGrid } from "@/features/simulation/queries/get-latest-spl-grid";
import { parseSceneSimulation } from "@/features/simulation/schemas/parse-scene-simulation";
import { getActiveUser } from "@/lib/session";

export default async function SceneRoom3dPage({
  params,
}: {
  params: Promise<{ projectId: string; sceneId: string }>;
}) {
  const { projectId, sceneId } = await params;

  const activeUser = await getActiveUser();
  if (!activeUser.ok) redirect("/login");

  const scene = await getSceneWithRole(activeUser.data.id, sceneId);
  if (!scene || scene.projectId !== projectId) notFound();

  const parsedDocument = parseRoom(scene.room);
  const parsedSimulation = parseSceneSimulation(scene.simulation);
  // No debería pasar nunca: las actions validan antes de persistir, igual que en la página del 2D.
  if (!parsedDocument.ok || !parsedSimulation.ok) notFound();

  const [materialLibrary, materialColorsById, speakers, overlay] =
    await Promise.all([
      listRoomMaterialOptions(),
      listRoomMaterialColors(),
      // Del GRAFO, no del recinto: aquí las cajas se colocan, no se crean (§5.3).
      listSceneSpeakers(scene.signalFlow),
      getLatestSplGrid(scene.id),
    ]);
  const validation = validateRoom(parsedDocument.data, materialLibrary);
  const canManage = scene.role === "OWNER" || scene.role === "EDITOR";

  // Sin cabecera propia: el editor llena la ventana y el nombre va en su franja de titulo.
  return (
    <Room3dEditor
      sceneName={scene.name}
      init={{
        sceneId: scene.id,
        canManage,
        document: parsedDocument.data,
        materialOptions: materialLibrary.options,
        materialIds: materialLibrary.materialIds,
        sceneStatus: scene.status,
        validation,
      }}
      speakers={speakers}
      simulation={parsedSimulation.data}
      materialColorsById={materialColorsById}
      overlay={overlay}
    />
  );
}

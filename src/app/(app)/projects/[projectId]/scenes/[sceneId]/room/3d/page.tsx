// src/app/(app)/projects/[projectId]/scenes/[sceneId]/room/3d/page.tsx — editor 3D del recinto
// (Fase 4, Tarea 1): extrusión, cámara, picking de superficies y panel de materiales.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Room3dEditor } from "@/features/room-3d/components/room-3d-editor";
import { listRoomMaterialColors } from "@/features/room-3d/queries/list-room-material-colors";
import { listRoomMaterialOptions } from "@/features/room-editor/queries/list-room-material-options";
import { parseRoom } from "@/features/room-editor/schemas/parse-room";
import { validateRoom } from "@/features/room-editor/validation/validate-room";
import { getSceneWithRole } from "@/features/scenes/queries";
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
  // No debería pasar nunca: saveRoom valida antes de persistir, igual que en la página del 2D.
  if (!parsedDocument.ok) notFound();

  const [materialLibrary, materialColorsById] = await Promise.all([
    listRoomMaterialOptions(),
    listRoomMaterialColors(),
  ]);
  const validation = validateRoom(parsedDocument.data, materialLibrary);
  const canManage = scene.role === "OWNER" || scene.role === "EDITOR";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href={`/projects/${projectId}/scenes/${sceneId}/room`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Editor 2D
        </Link>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {scene.name}
        </h1>
      </div>
      <Room3dEditor
        init={{
          sceneId: scene.id,
          canManage,
          document: parsedDocument.data,
          materialOptions: materialLibrary.options,
          materialIds: materialLibrary.materialIds,
          sceneStatus: scene.status,
          validation,
        }}
        materialColorsById={materialColorsById}
      />
    </div>
  );
}

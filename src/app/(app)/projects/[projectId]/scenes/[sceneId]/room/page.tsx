// src/app/(app)/projects/[projectId]/scenes/[sceneId]/room/page.tsx — editor 2D del recinto.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RoomEditor } from "@/features/room-editor/components/room-editor";
import { listRoomMaterialOptions } from "@/features/room-editor/queries/list-room-material-options";
import { parseRoom } from "@/features/room-editor/schemas/parse-room";
import { validateRoom } from "@/features/room-editor/validation/validate-room";
import { getSceneWithRole } from "@/features/scenes/queries";
import { getActiveUser } from "@/lib/session";

export default async function SceneRoomPage({
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
  // No debería pasar nunca: saveRoom valida antes de persistir. Igual que en la página del flujo,
  // se corta aquí en vez de renderizar un editor sobre un documento que no se puede interpretar.
  if (!parsedDocument.ok) notFound();

  const materialLibrary = await listRoomMaterialOptions();
  const validation = validateRoom(parsedDocument.data, materialLibrary);
  const canManage = scene.role === "OWNER" || scene.role === "EDITOR";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href={`/projects/${projectId}/scenes/${sceneId}/flow`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Flujo de señal
        </Link>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {scene.name}
        </h1>
      </div>
      <RoomEditor
        init={{
          sceneId: scene.id,
          canManage,
          document: parsedDocument.data,
          materialOptions: materialLibrary.options,
          materialIds: materialLibrary.materialIds,
          sceneStatus: scene.status,
          validation,
        }}
      />
    </div>
  );
}

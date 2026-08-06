// src/app/(app)/projects/[projectId]/scenes/[sceneId]/flow/page.tsx — editor de flujo de señal.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSceneWithRole } from "@/features/scenes/queries";
import { FlowEditor } from "@/features/signal-flow/components/flow-editor";
import { toReactFlowState } from "@/features/signal-flow/mapping/react-flow-adapter";
import { hydrateFlow } from "@/features/signal-flow/model/resolved-flow";
import { listFlowCatalogLibrary } from "@/features/signal-flow/queries/list-flow-catalog-library";
import { parseSignalFlow } from "@/features/signal-flow/schemas/signal-flow";
import { validateSignalFlow } from "@/features/signal-flow/validation/validate-signal-flow";
import { getActiveUser } from "@/lib/session";

export default async function SceneFlowPage({
  params,
}: {
  params: Promise<{ projectId: string; sceneId: string }>;
}) {
  const { projectId, sceneId } = await params;

  const activeUser = await getActiveUser();
  if (!activeUser.ok) redirect("/login");

  const scene = await getSceneWithRole(activeUser.data.id, sceneId);
  if (!scene || scene.projectId !== projectId) notFound();

  const parsedDocument = parseSignalFlow(scene.signalFlow);
  // No debería pasar nunca: saveSignalFlow valida antes de persistir. Si pasa, es un bug de otra
  // capa, no algo que el usuario pueda arreglar recargando — se corta aquí en vez de renderizar
  // un editor sobre un documento que no se puede interpretar.
  if (!parsedDocument.ok) notFound();

  const library = await listFlowCatalogLibrary();
  const resolved = hydrateFlow(parsedDocument.data, library.snapshot);
  const validation = validateSignalFlow(resolved);
  const { nodes, edges } = toReactFlowState(parsedDocument.data);
  const canManage = scene.role === "OWNER" || scene.role === "EDITOR";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Volver al proyecto
        </Link>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {scene.name}
        </h1>
      </div>
      <FlowEditor
        init={{
          sceneId: scene.id,
          canManage,
          nodes,
          edges,
          viewport: parsedDocument.data.viewport,
          library,
          sceneStatus: scene.status,
          validation,
        }}
      />
    </div>
  );
}

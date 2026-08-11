// src/app/(app)/projects/[projectId]/scenes/[sceneId]/results/[simulationId]/page.tsx —
// resultados de una simulación (Fase 6, tarea 2).
//
// Un job que no llegó a COMPLETED no tiene nada que pintar, así que en vez de una página de
// secciones vacías se muestra en qué estado quedó y por qué.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSceneWithRole } from "@/features/scenes/queries";
import { OutdatedBanner } from "@/features/simulation/components/results/outdated-banner";
import { ResultsView } from "@/features/simulation/components/results/results-view";
import { getSimulationView } from "@/features/simulation/queries/get-simulation-view";
import { isSimulationOutdated } from "@/features/simulation/queries/is-simulation-outdated";
import { getActiveUser } from "@/lib/session";

export default async function SimulationResultsPage({
  params,
}: {
  params: Promise<{
    projectId: string;
    sceneId: string;
    simulationId: string;
  }>;
}) {
  const { projectId, sceneId, simulationId } = await params;

  const activeUser = await getActiveUser();
  if (!activeUser.ok) redirect("/login");

  const detail = await getSimulationView(activeUser.data.id, simulationId);
  if (!detail || detail.sceneId !== sceneId || detail.projectId !== projectId) {
    notFound();
  }

  const editorHref = `/projects/${projectId}/scenes/${sceneId}/room/3d`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={editorHref}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Editor 3D
        </Link>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Resultados · {detail.sceneName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Simulado el{" "}
          {detail.createdAt.toLocaleString("es", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
      </div>

      {detail.job.status === "COMPLETED" ? (
        <Results
          detail={detail}
          userId={activeUser.data.id}
          href={editorHref}
        />
      ) : (
        <UnfinishedJob detail={detail} />
      )}
    </div>
  );
}

async function Results({
  detail,
  userId,
  href,
}: {
  detail: NonNullable<Awaited<ReturnType<typeof getSimulationView>>>;
  userId: string;
  href: string;
}) {
  const scene = await getSceneWithRole(userId, detail.sceneId);
  const outdated = scene
    ? await isSimulationOutdated(scene, detail.requestHash)
    : "unknown";

  return (
    <>
      <OutdatedBanner state={outdated} sceneHref={href} />
      <ResultsView
        view={detail.view}
        document={detail.document}
        resolutionM={detail.resolutionM}
        simulationId={detail.simulationId}
        canApply={scene?.role === "OWNER" || scene?.role === "EDITOR"}
      />
    </>
  );
}

function UnfinishedJob({
  detail,
}: {
  detail: NonNullable<Awaited<ReturnType<typeof getSimulationView>>>;
}) {
  const { status, progress, error } = detail.job;

  return (
    <div className="rounded-md border p-6">
      <p className="text-sm font-medium">
        {status === "FAILED"
          ? "La simulación falló"
          : `La simulación está en ${status.toLowerCase()} (${progress} %)`}
      </p>
      {error ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {error.code}: {error.message}
        </p>
      ) : null}
    </div>
  );
}

// src/app/(app)/projects/[projectId]/page.tsx

import { notFound, redirect } from "next/navigation";
import { DeleteProjectAlert } from "@/features/projects/components/delete-project-alert";
import { EditProjectDialog } from "@/features/projects/components/edit-project-dialog";
import { ProjectMembersList } from "@/features/projects/components/project-members-list";
import { ProjectRoleBadge } from "@/features/projects/components/project-role-badge";
import { ShareProjectDialog } from "@/features/projects/components/share-project-dialog";
import { getProjectWithRole } from "@/features/projects/queries";
import { SceneList } from "@/features/scenes/components/scene-list";
import { listScenesForProject } from "@/features/scenes/queries";
import { getActiveUser } from "@/lib/session";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const activeUser = await getActiveUser();
  if (!activeUser.ok) redirect("/login");

  const project = await getProjectWithRole(activeUser.data.id, projectId);
  if (!project) notFound();

  const scenes = await listScenesForProject(project.id);
  const isOwner = project.role === "OWNER";
  const canManageScenes = project.role === "OWNER" || project.role === "EDITOR";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {project.name}
            </h1>
            <ProjectRoleBadge role={project.role} />
          </div>
          {project.description ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {project.description}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            Dueño: {project.ownerName}
          </p>
        </div>
        {isOwner ? (
          <div className="flex items-center gap-2">
            <ShareProjectDialog projectId={project.id} />
            <EditProjectDialog
              projectId={project.id}
              name={project.name}
              description={project.description}
            />
            <DeleteProjectAlert
              projectId={project.id}
              projectName={project.name}
            />
          </div>
        ) : null}
      </div>

      {isOwner ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-medium">Miembros</h2>
          <ProjectMembersList
            projectId={project.id}
            members={project.members}
            canManage={isOwner}
          />
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-medium">Escenas</h2>
        <SceneList
          scenes={scenes}
          projectId={project.id}
          canManage={canManageScenes}
        />
      </section>
    </div>
  );
}

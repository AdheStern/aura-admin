// src/app/(app)/projects/page.tsx

import { FolderKanbanIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { ProjectCard } from "@/features/projects/components/project-card";
import { listProjectsForUser } from "@/features/projects/queries";
import { getActiveUser } from "@/lib/session";

export default async function ProjectsPage() {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) redirect("/login");

  const projects = await listProjectsForUser(activeUser.data.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Proyectos
          </h1>
          <p className="text-sm text-muted-foreground">
            Tus proyectos y los que compartieron contigo.
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanbanIcon}
          title="Todavía no tienes proyectos"
          hint="Un proyecto agrupa las escenas de un mismo recinto. Dentro de cada escena se arma el sistema de sonido, se dibuja la sala y se simula."
        >
          <CreateProjectDialog />
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

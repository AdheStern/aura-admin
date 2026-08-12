// src/features/projects/components/project-card.tsx — una tarjeta de la rejilla de proyectos.
//
// La tarjeta entera es el enlace, en vez de un botón "Abrir" al pie: abrir es lo que se hace casi
// siempre al llegar aquí, y así el blanco de clic es toda la tarjeta.

import { FolderKanbanIcon, LayersIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ProjectRoleBadge } from "@/features/projects/components/project-role-badge";
import type { ProjectListItem } from "@/features/projects/types";

export function ProjectCard({ project }: { project: ProjectListItem }) {
  return (
    // El anillo de foco se pinta en la tarjeta y no en el enlace porque `Card` recorta lo que se
    // sale (`overflow-hidden`): dentro, el anillo del enlace quedaría cortado por los cuatro lados.
    <Card className="gap-0 p-0 transition-colors hover:bg-accent/50 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50">
      <Link
        href={`/projects/${project.id}`}
        className="flex flex-1 flex-col gap-3 p-4 outline-none"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FolderKanbanIcon className="size-5" aria-hidden />
          </div>
          <ProjectRoleBadge role={project.role} />
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-medium">{project.name}</h3>
          {project.description ? (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
              {project.description}
            </p>
          ) : null}
        </div>

        {/* `mt-auto` clava la línea de datos al pie: en una rejilla las tarjetas se estiran a la
            altura de la más alta, y sin esto quedarían a alturas distintas dentro de la misma fila. */}
        <div className="mt-auto flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex shrink-0 items-center gap-1">
            <LayersIcon className="size-3" aria-hidden />
            {project.sceneCount}{" "}
            {project.sceneCount === 1 ? "escena" : "escenas"}
          </span>
          <span className="flex min-w-0 items-center gap-1">
            <UserIcon className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{project.ownerName}</span>
          </span>
        </div>
      </Link>
    </Card>
  );
}

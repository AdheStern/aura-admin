// src/features/projects/components/project-list.tsx — la rejilla de proyectos con su buscador.

"use client";

import { useState } from "react";
import { ListSearch } from "@/components/list-search";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { ProjectCard } from "@/features/projects/components/project-card";
import type { ProjectListItem } from "@/features/projects/types";

export function ProjectList({ projects }: { projects: ProjectListItem[] }) {
  const [query, setQuery] = useState("");
  const shown = filterProjects(projects, query);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ListSearch
          value={query}
          onValueChange={setQuery}
          placeholder="Buscar proyectos"
          className="w-full sm:max-w-xs"
        />
        <div className="ml-auto shrink-0">
          <CreateProjectDialog />
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Ningún proyecto coincide con «{query}».
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Busca por nombre y descripción: el nombre solo se queda corto en cuanto hay varios homónimos. */
function filterProjects(projects: ProjectListItem[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return projects;

  return projects.filter(
    (project) =>
      project.name.toLowerCase().includes(needle) ||
      project.description?.toLowerCase().includes(needle),
  );
}

// src/features/projects/components/project-card.tsx

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectRoleBadge } from "@/features/projects/components/project-role-badge";
import type { ProjectListItem } from "@/features/projects/types";

export function ProjectCard({ project }: { project: ProjectListItem }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="truncate">{project.name}</span>
          <ProjectRoleBadge role={project.role} />
        </CardTitle>
        {project.description ? (
          <CardDescription className="line-clamp-2">
            {project.description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {project.sceneCount} {project.sceneCount === 1 ? "escena" : "escenas"} ·
        Dueño: {project.ownerName}
      </CardContent>
      <CardFooter>
        <Button
          render={<Link href={`/projects/${project.id}`} />}
          nativeButton={false}
          variant="outline"
          className="w-full"
        >
          Abrir
        </Button>
      </CardFooter>
    </Card>
  );
}

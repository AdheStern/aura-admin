// src/features/projects/components/project-members-list.tsx

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { removeProjectMember } from "@/features/projects/actions";
import { ProjectRoleBadge } from "@/features/projects/components/project-role-badge";
import type { ProjectMemberItem } from "@/features/projects/types";

export function ProjectMembersList({
  projectId,
  members,
  canManage,
}: {
  projectId: string;
  members: ProjectMemberItem[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove(userId: string) {
    setRemovingId(userId);
    setError(null);
    const result = await removeProjectMember(projectId, userId);
    setRemovingId(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.refresh();
  }

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nadie más tiene acceso todavía.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {members.map((member) => (
        <div
          key={member.userId}
          className="flex items-center justify-between gap-2 rounded-lg border p-2"
        >
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarFallback>
                {member.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{member.name}</span>
              <span className="text-xs text-muted-foreground">
                {member.email}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ProjectRoleBadge role={member.role} />
            {canManage ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={removingId === member.userId}
                onClick={() => handleRemove(member.userId)}
              >
                Quitar
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

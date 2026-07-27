// src/features/projects/types.ts

import type { ProjectRole } from "@/features/projects/schemas/roles";

export type ProjectListItem = {
  id: string;
  name: string;
  description: string | null;
  role: ProjectRole;
  ownerId: string;
  ownerName: string;
  sceneCount: number;
  memberCount: number;
  updatedAt: Date;
};

export type ProjectMemberItem = {
  userId: string;
  name: string;
  email: string;
  role: ProjectRole;
};

export type ProjectWithRole = {
  id: string;
  name: string;
  description: string | null;
  role: ProjectRole;
  ownerId: string;
  ownerName: string;
  members: ProjectMemberItem[];
  sceneCount: number;
  createdAt: Date;
  updatedAt: Date;
};

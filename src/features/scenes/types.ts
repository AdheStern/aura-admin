// src/features/scenes/types.ts

import type { SceneStatus } from "@/features/scenes/schemas";

export type SceneListItem = {
  id: string;
  name: string;
  status: SceneStatus;
  updatedAt: Date;
};

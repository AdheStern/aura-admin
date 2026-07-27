// src/features/scenes/components/scene-status-badge.tsx

import { Badge } from "@/components/ui/badge";
import type { SceneStatus } from "@/features/scenes/schemas";

const STATUS_LABEL: Record<SceneStatus, string> = {
  DRAFT: "Borrador",
  FLOW_READY: "Flujo listo",
  ROOM_READY: "Recinto listo",
  SIMULATED: "Simulada",
};

const STATUS_VARIANT: Record<SceneStatus, "outline" | "secondary" | "default"> =
  {
    DRAFT: "outline",
    FLOW_READY: "secondary",
    ROOM_READY: "secondary",
    SIMULATED: "default",
  };

export function SceneStatusBadge({ status }: { status: SceneStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

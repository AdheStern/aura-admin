// src/features/catalogs/components/verified-badge.tsx

import { Badge } from "@/components/ui/badge";

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <Badge variant={verified ? "default" : "outline"}>
      {verified ? "Verificado" : "Sin verificar"}
    </Badge>
  );
}

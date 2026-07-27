// src/features/catalogs/components/speaker-table.tsx

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VerifiedBadge } from "@/features/catalogs/components/verified-badge";
import { SPEAKER_KIND_LABEL } from "@/features/catalogs/schemas/speaker-categories";
import type { CatalogSpeakerListItem } from "@/features/catalogs/types";

export function SpeakerTable({
  speakers,
}: {
  speakers: CatalogSpeakerListItem[];
}) {
  if (speakers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No hay parlantes todavía.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Marca</TableHead>
          <TableHead>Modelo</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {speakers.map((speaker) => (
          <TableRow key={speaker.id}>
            <TableCell>
              <Link
                href={`/catalogs/speakers/${speaker.id}`}
                className="hover:underline"
              >
                {speaker.brand}
              </Link>
            </TableCell>
            <TableCell>{speaker.model}</TableCell>
            <TableCell>
              {SPEAKER_KIND_LABEL[
                speaker.category as keyof typeof SPEAKER_KIND_LABEL
              ] ?? speaker.category}
            </TableCell>
            <TableCell>
              <VerifiedBadge verified={speaker.verified} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

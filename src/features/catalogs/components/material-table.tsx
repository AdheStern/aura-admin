// src/features/catalogs/components/material-table.tsx

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
import type { CatalogMaterialListItem } from "@/features/catalogs/types";

export function MaterialTable({
  materials,
}: {
  materials: CatalogMaterialListItem[];
}) {
  if (materials.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay materiales todavía.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {materials.map((material) => (
          <TableRow key={material.id}>
            <TableCell>
              <Link
                href={`/catalogs/materials/${material.id}`}
                className="hover:underline"
              >
                {material.name}
              </Link>
            </TableCell>
            <TableCell>{material.category}</TableCell>
            <TableCell>
              <VerifiedBadge verified={material.verified} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

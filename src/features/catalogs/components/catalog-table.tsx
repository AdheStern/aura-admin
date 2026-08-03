// src/features/catalogs/components/catalog-table.tsx — listado común a los cinco catálogos.
// La primera celda siempre enlaza al detalle y la columna de estado se añade sola: son las dos
// cosas que toda tabla de catálogo tiene, y así ningún tipo puede olvidarse de ninguna.

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

export type CatalogTableRow = {
  id: string;
  cells: string[];
  verified: boolean;
};

export function CatalogTable({
  headers,
  rows,
  basePath,
  emptyLabel,
}: {
  headers: string[];
  rows: CatalogTableRow[];
  basePath: string;
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((header) => (
            <TableHead key={header}>{header}</TableHead>
          ))}
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            {row.cells.map((cell, index) => (
              <TableCell key={headers[index] ?? index}>
                {index === 0 ? (
                  <Link
                    href={`${basePath}/${row.id}`}
                    className="hover:underline"
                  >
                    {cell}
                  </Link>
                ) : (
                  cell
                )}
              </TableCell>
            ))}
            <TableCell>
              <VerifiedBadge verified={row.verified} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// src/app/(app)/catalogs/consoles/page.tsx

import { CatalogCategoryFilter } from "@/features/catalogs/components/catalog-category-filter";
import { CatalogTable } from "@/features/catalogs/components/catalog-table";
import { CreateConsoleDialog } from "@/features/catalogs/components/create-console-dialog";
import { listConsoles } from "@/features/catalogs/queries";
import {
  CONSOLE_CATEGORIES,
  CONSOLE_KIND_LABEL,
  categoryLabel,
  toCategoryOptions,
} from "@/features/catalogs/schemas/kind-labels";

export default async function ConsolesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const consoles = await listConsoles(category);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Consolas
          </h1>
          <p className="text-sm text-muted-foreground">
            Canales de entrada, buses de salida y rangos de ganancia.
          </p>
        </div>
        <CreateConsoleDialog />
      </div>
      <CatalogCategoryFilter
        basePath="/catalogs/consoles"
        options={toCategoryOptions(CONSOLE_CATEGORIES, CONSOLE_KIND_LABEL)}
      />
      <CatalogTable
        headers={["Marca", "Modelo", "Tipo"]}
        rows={consoles.map((item) => ({
          id: item.id,
          cells: [
            item.brand,
            item.model,
            categoryLabel(item.category, CONSOLE_KIND_LABEL),
          ],
          verified: item.verified,
        }))}
        basePath="/catalogs/consoles"
        emptyLabel="No hay consolas todavía."
      />
    </div>
  );
}

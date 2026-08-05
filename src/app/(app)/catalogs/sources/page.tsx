// src/app/(app)/catalogs/sources/page.tsx

import { CatalogCategoryFilter } from "@/features/catalogs/components/catalog-category-filter";
import { CatalogTable } from "@/features/catalogs/components/catalog-table";
import { CreateSourceDialog } from "@/features/catalogs/components/create-source-dialog";
import { listSources } from "@/features/catalogs/queries";
import {
  categoryLabel,
  SOURCE_CATEGORIES,
  SOURCE_KIND_LABEL,
  toCategoryOptions,
} from "@/features/catalogs/schemas/kind-labels";

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const sources = await listSources(category);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Fuentes
          </h1>
          <p className="text-sm text-muted-foreground">
            Instrumentos y voces del nodo de origen de la cadena de señal.
          </p>
        </div>
        <CreateSourceDialog />
      </div>
      <CatalogCategoryFilter
        basePath="/catalogs/sources"
        options={toCategoryOptions(SOURCE_CATEGORIES, SOURCE_KIND_LABEL)}
      />
      <CatalogTable
        headers={["Nombre", "Familia"]}
        rows={sources.map((source) => ({
          id: source.id,
          cells: [
            source.name,
            categoryLabel(source.category, SOURCE_KIND_LABEL),
          ],
          verified: source.verified,
        }))}
        basePath="/catalogs/sources"
        emptyLabel="No hay fuentes todavía."
      />
    </div>
  );
}

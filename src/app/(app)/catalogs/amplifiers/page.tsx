// src/app/(app)/catalogs/amplifiers/page.tsx

import { CatalogCategoryFilter } from "@/features/catalogs/components/catalog-category-filter";
import { CatalogTable } from "@/features/catalogs/components/catalog-table";
import { CreateAmplifierDialog } from "@/features/catalogs/components/create-amplifier-dialog";
import { listAmplifiers } from "@/features/catalogs/queries";
import {
  AMPLIFIER_CATEGORIES,
  AMPLIFIER_KIND_LABEL,
  categoryLabel,
  toCategoryOptions,
} from "@/features/catalogs/schemas/kind-labels";

export default async function AmplifiersPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const amplifiers = await listAmplifiers(category);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Amplificadores / PA
          </h1>
          <p className="text-sm text-muted-foreground">
            Potencia por canal según la impedancia de carga del parlante.
          </p>
        </div>
        <CreateAmplifierDialog />
      </div>
      <CatalogCategoryFilter
        basePath="/catalogs/amplifiers"
        options={toCategoryOptions(AMPLIFIER_CATEGORIES, AMPLIFIER_KIND_LABEL)}
      />
      <CatalogTable
        headers={["Marca", "Modelo", "Tipo"]}
        rows={amplifiers.map((item) => ({
          id: item.id,
          cells: [
            item.brand,
            item.model,
            categoryLabel(item.category, AMPLIFIER_KIND_LABEL),
          ],
          verified: item.verified,
        }))}
        basePath="/catalogs/amplifiers"
        emptyLabel="No hay amplificadores todavía."
      />
    </div>
  );
}

// src/app/(app)/catalogs/speakers/page.tsx

import { CatalogCategoryFilter } from "@/features/catalogs/components/catalog-category-filter";
import { CatalogTable } from "@/features/catalogs/components/catalog-table";
import { CreateSpeakerDialog } from "@/features/catalogs/components/create-speaker-dialog";
import { listSpeakers } from "@/features/catalogs/queries";
import {
  categoryLabel,
  SPEAKER_CATEGORIES,
  SPEAKER_KIND_LABEL,
  toCategoryOptions,
} from "@/features/catalogs/schemas/kind-labels";

export default async function SpeakersPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const speakers = await listSpeakers(category);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Parlantes
          </h1>
          <p className="text-sm text-muted-foreground">
            Catálogo de altavoces con datasheet.
          </p>
        </div>
        <CreateSpeakerDialog />
      </div>
      <CatalogCategoryFilter
        basePath="/catalogs/speakers"
        options={toCategoryOptions(SPEAKER_CATEGORIES, SPEAKER_KIND_LABEL)}
      />
      <CatalogTable
        headers={["Marca", "Modelo", "Categoría"]}
        rows={speakers.map((speaker) => ({
          id: speaker.id,
          cells: [
            speaker.brand,
            speaker.model,
            categoryLabel(speaker.category, SPEAKER_KIND_LABEL),
          ],
          verified: speaker.verified,
        }))}
        basePath="/catalogs/speakers"
        emptyLabel="No hay parlantes todavía."
      />
    </div>
  );
}

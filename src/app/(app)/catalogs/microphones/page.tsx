// src/app/(app)/catalogs/microphones/page.tsx

import { CatalogCategoryFilter } from "@/features/catalogs/components/catalog-category-filter";
import { CatalogTable } from "@/features/catalogs/components/catalog-table";
import { CreateMicrophoneDialog } from "@/features/catalogs/components/create-microphone-dialog";
import { listMicrophones } from "@/features/catalogs/queries";
import {
  categoryLabel,
  MICROPHONE_CATEGORIES,
  MICROPHONE_KIND_LABEL,
  toCategoryOptions,
} from "@/features/catalogs/schemas/kind-labels";

export default async function MicrophonesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const microphones = await listMicrophones(category);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Micrófonos
          </h1>
          <p className="text-sm text-muted-foreground">
            Respuesta en frecuencia, patrón polar y sensibilidad.
          </p>
        </div>
        <CreateMicrophoneDialog />
      </div>
      <CatalogCategoryFilter
        basePath="/catalogs/microphones"
        options={toCategoryOptions(
          MICROPHONE_CATEGORIES,
          MICROPHONE_KIND_LABEL,
        )}
      />
      <CatalogTable
        headers={["Marca", "Modelo", "Tipo"]}
        rows={microphones.map((microphone) => ({
          id: microphone.id,
          cells: [
            microphone.brand,
            microphone.model,
            categoryLabel(microphone.category, MICROPHONE_KIND_LABEL),
          ],
          verified: microphone.verified,
        }))}
        basePath="/catalogs/microphones"
        emptyLabel="No hay micrófonos todavía."
      />
    </div>
  );
}

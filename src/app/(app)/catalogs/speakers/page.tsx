// src/app/(app)/catalogs/speakers/page.tsx

import { CreateSpeakerDialog } from "@/features/catalogs/components/create-speaker-dialog";
import { SpeakerCategoryFilter } from "@/features/catalogs/components/speaker-category-filter";
import { SpeakerTable } from "@/features/catalogs/components/speaker-table";
import { listSpeakers } from "@/features/catalogs/queries";

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
      <SpeakerCategoryFilter />
      <SpeakerTable speakers={speakers} />
    </div>
  );
}

// src/app/(app)/catalogs/sources/[sourceId]/page.tsx

import { notFound } from "next/navigation";
import { deleteSource } from "@/features/catalogs/actions";
import { DeleteCatalogAlert } from "@/features/catalogs/components/delete-catalog-alert";
import { EditSourceDialog } from "@/features/catalogs/components/edit-source-dialog";
import { SourceDatasheet } from "@/features/catalogs/components/source-datasheet";
import { VerifiedBadge } from "@/features/catalogs/components/verified-badge";
import { getSource } from "@/features/catalogs/queries";

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const { sourceId } = await params;
  const source = await getSource(sourceId);
  if (!source) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {source.name}
          </h1>
          <VerifiedBadge verified={source.verified} />
        </div>
        <div className="flex items-center gap-2">
          <EditSourceDialog
            sourceId={source.id}
            specJson={JSON.stringify(source.specRaw, null, 2)}
            initialVerified={source.verified}
          />
          <DeleteCatalogAlert
            itemId={source.id}
            itemLabel={source.name}
            onDelete={deleteSource}
            redirectTo="/catalogs/sources"
          />
        </div>
      </div>

      {source.spec ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-medium">Datasheet</h2>
          <SourceDatasheet spec={source.spec} />
        </section>
      ) : (
        <p className="text-sm text-destructive">
          No se pudo interpretar el datasheet (versión de spec no soportada:{" "}
          {source.specVersion}
          ). Edítalo para corregirlo.
        </p>
      )}
    </div>
  );
}

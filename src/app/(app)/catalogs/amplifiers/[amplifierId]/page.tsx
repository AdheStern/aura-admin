// src/app/(app)/catalogs/amplifiers/[amplifierId]/page.tsx

import { notFound } from "next/navigation";
import { deleteAmplifier } from "@/features/catalogs/actions";
import { AmplifierDatasheet } from "@/features/catalogs/components/amplifier-datasheet";
import { DeleteCatalogAlert } from "@/features/catalogs/components/delete-catalog-alert";
import { EditAmplifierDialog } from "@/features/catalogs/components/edit-amplifier-dialog";
import { VerifiedBadge } from "@/features/catalogs/components/verified-badge";
import { getAmplifier } from "@/features/catalogs/queries";

export default async function AmplifierDetailPage({
  params,
}: {
  params: Promise<{ amplifierId: string }>;
}) {
  const { amplifierId } = await params;
  const item = await getAmplifier(amplifierId);
  if (!item) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {item.brand} {item.model}
          </h1>
          <VerifiedBadge verified={item.verified} />
        </div>
        <div className="flex items-center gap-2">
          <EditAmplifierDialog
            amplifierId={item.id}
            brand={item.brand}
            model={item.model}
            specJson={JSON.stringify(item.specRaw, null, 2)}
            initialVerified={item.verified}
          />
          <DeleteCatalogAlert
            itemId={item.id}
            itemLabel={`${item.brand} ${item.model}`}
            onDelete={deleteAmplifier}
            redirectTo="/catalogs/amplifiers"
          />
        </div>
      </div>

      {item.spec ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-medium">Datasheet</h2>
          <AmplifierDatasheet spec={item.spec} />
        </section>
      ) : (
        <p className="text-sm text-destructive">
          No se pudo interpretar el datasheet (versión de spec no soportada:{" "}
          {item.specVersion}
          ). Edítalo para corregirlo.
        </p>
      )}
    </div>
  );
}

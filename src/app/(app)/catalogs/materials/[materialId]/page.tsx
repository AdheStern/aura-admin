// src/app/(app)/catalogs/materials/[materialId]/page.tsx

import { notFound } from "next/navigation";
import { deleteMaterial } from "@/features/catalogs/actions";
import { DeleteCatalogAlert } from "@/features/catalogs/components/delete-catalog-alert";
import { EditMaterialDialog } from "@/features/catalogs/components/edit-material-dialog";
import { MaterialBandChart } from "@/features/catalogs/components/material-band-chart";
import { MaterialDatasheet } from "@/features/catalogs/components/material-datasheet";
import { VerifiedBadge } from "@/features/catalogs/components/verified-badge";
import { getMaterial } from "@/features/catalogs/queries";

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ materialId: string }>;
}) {
  const { materialId } = await params;
  const material = await getMaterial(materialId);
  if (!material) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {material.name}
          </h1>
          <VerifiedBadge verified={material.verified} />
        </div>
        <div className="flex items-center gap-2">
          <EditMaterialDialog
            materialId={material.id}
            specJson={JSON.stringify(material.specRaw, null, 2)}
            initialVerified={material.verified}
          />
          <DeleteCatalogAlert
            itemId={material.id}
            itemLabel={material.name}
            onDelete={deleteMaterial}
            redirectTo="/catalogs/materials"
          />
        </div>
      </div>

      {material.spec ? (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-medium">Datasheet</h2>
            <MaterialDatasheet spec={material.spec} />
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-medium">
              Absorción y dispersión por banda
            </h2>
            <MaterialBandChart
              absorption={material.spec.absorption}
              scattering={material.spec.scattering}
            />
          </section>
        </>
      ) : (
        <p className="text-sm text-destructive">
          No se pudo interpretar el datasheet (versión de spec no soportada:{" "}
          {material.specVersion}
          ). Edítalo para corregirlo.
        </p>
      )}
    </div>
  );
}

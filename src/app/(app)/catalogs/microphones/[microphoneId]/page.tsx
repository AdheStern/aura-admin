// src/app/(app)/catalogs/microphones/[microphoneId]/page.tsx

import { notFound } from "next/navigation";
import { deleteMicrophone } from "@/features/catalogs/actions";
import { DeleteCatalogAlert } from "@/features/catalogs/components/delete-catalog-alert";
import { EditMicrophoneDialog } from "@/features/catalogs/components/edit-microphone-dialog";
import { FrequencyResponseChart } from "@/features/catalogs/components/frequency-response-chart";
import { MicrophoneDatasheet } from "@/features/catalogs/components/microphone-datasheet";
import { VerifiedBadge } from "@/features/catalogs/components/verified-badge";
import { getMicrophone } from "@/features/catalogs/queries";

export default async function MicrophoneDetailPage({
  params,
}: {
  params: Promise<{ microphoneId: string }>;
}) {
  const { microphoneId } = await params;
  const microphone = await getMicrophone(microphoneId);
  if (!microphone) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {microphone.brand} {microphone.model}
          </h1>
          <VerifiedBadge verified={microphone.verified} />
        </div>
        <div className="flex items-center gap-2">
          <EditMicrophoneDialog
            microphoneId={microphone.id}
            brand={microphone.brand}
            model={microphone.model}
            specJson={JSON.stringify(microphone.specRaw, null, 2)}
            initialVerified={microphone.verified}
          />
          <DeleteCatalogAlert
            itemId={microphone.id}
            itemLabel={`${microphone.brand} ${microphone.model}`}
            onDelete={deleteMicrophone}
            redirectTo="/catalogs/microphones"
          />
        </div>
      </div>

      {microphone.spec ? (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-medium">Datasheet</h2>
            <MicrophoneDatasheet spec={microphone.spec} />
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-medium">
              Respuesta en frecuencia
            </h2>
            <FrequencyResponseChart
              curve={microphone.spec.frequencyResponse.curve}
            />
          </section>
        </>
      ) : (
        <p className="text-sm text-destructive">
          No se pudo interpretar el datasheet (versión de spec no soportada:{" "}
          {microphone.specVersion}
          ). Edítalo para corregirlo.
        </p>
      )}
    </div>
  );
}

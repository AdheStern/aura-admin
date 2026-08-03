// src/app/(app)/catalogs/speakers/[speakerId]/page.tsx

import { notFound } from "next/navigation";
import { deleteSpeaker } from "@/features/catalogs/actions";
import { DeleteCatalogAlert } from "@/features/catalogs/components/delete-catalog-alert";
import { EditSpeakerDialog } from "@/features/catalogs/components/edit-speaker-dialog";
import { FrequencyResponseChart } from "@/features/catalogs/components/frequency-response-chart";
import { SpeakerDatasheet } from "@/features/catalogs/components/speaker-datasheet";
import { VerifiedBadge } from "@/features/catalogs/components/verified-badge";
import { getSpeaker } from "@/features/catalogs/queries";

export default async function SpeakerDetailPage({
  params,
}: {
  params: Promise<{ speakerId: string }>;
}) {
  const { speakerId } = await params;
  const speaker = await getSpeaker(speakerId);
  if (!speaker) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {speaker.brand} {speaker.model}
          </h1>
          <VerifiedBadge verified={speaker.verified} />
        </div>
        <div className="flex items-center gap-2">
          <EditSpeakerDialog
            speakerId={speaker.id}
            brand={speaker.brand}
            model={speaker.model}
            specJson={JSON.stringify(speaker.specRaw, null, 2)}
            initialVerified={speaker.verified}
          />
          <DeleteCatalogAlert
            itemId={speaker.id}
            itemLabel={`${speaker.brand} ${speaker.model}`}
            onDelete={deleteSpeaker}
            redirectTo="/catalogs/speakers"
          />
        </div>
      </div>

      {speaker.spec ? (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-medium">Datasheet</h2>
            <SpeakerDatasheet spec={speaker.spec} />
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-medium">
              Respuesta en frecuencia
            </h2>
            <FrequencyResponseChart
              curve={speaker.spec.frequencyResponse.curve}
            />
          </section>
        </>
      ) : (
        <p className="text-sm text-destructive">
          No se pudo interpretar el datasheet (versión de spec no soportada:{" "}
          {speaker.specVersion}
          ). Edítalo para corregirlo.
        </p>
      )}
    </div>
  );
}

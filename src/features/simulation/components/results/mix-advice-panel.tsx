// src/features/simulation/components/results/mix-advice-panel.tsx — la sección de criterio.
//
// Va la ÚLTIMA y enmarcada a propósito. Todo lo anterior —veredicto, alertas, recomendaciones,
// comprobaciones, cifras por banda— sale de fórmulas: el `+5.2 dB en 4 kHz` de una tarjeta lo
// calculó SourceEqRule con el desvío medido. Lo de aquí lo propone un modelo de lenguaje. Que un
// `ratio 3:1` y un `RT60 = 1.42 s` se vean distintos no es purismo: es lo que permite contestar de
// dónde sale cada cifra cuando lo pregunten, y por eso el rótulo no se puede quitar ni suavizar.
//
// Si no hay clave configurada la sección se pinta igual, con su explicación. Esconderla haría
// pensar que la función no existe.

import { FlaskConical } from "lucide-react";
import { getLlmSettings } from "@/features/settings/queries/get-llm-settings";
import { PROVIDER_LABELS } from "@/features/settings/schemas";
import { MixAdviceBoard } from "@/features/simulation/components/results/mix-advice-board";
import { getMixAdvice } from "@/features/simulation/queries/get-mix-advice";

export async function MixAdvicePanel({
  simulationId,
  userId,
}: {
  simulationId: string;
  userId: string;
}) {
  const [stored, settings] = await Promise.all([
    getMixAdvice(simulationId),
    getLlmSettings(userId),
  ]);

  const provider =
    settings.hasApiKey && settings.provider
      ? PROVIDER_LABELS[settings.provider]
      : null;

  return (
    <section className="flex flex-col gap-3 rounded-md border border-dashed border-amber-500/50 bg-amber-500/5 p-4">
      <div className="flex items-start gap-2">
        <FlaskConical
          className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
        <div>
          <h2 className="font-heading text-lg font-semibold">
            Asesor de mezcla (IA)
          </h2>
          <p className="text-sm text-muted-foreground">
            Criterio de mezcla propuesto por un modelo de lenguaje, no medido
            por el motor. Todo lo de arriba sale de fórmulas de acústica sobre
            esta simulación; esto no. Úsalo como punto de partida y contrástalo
            con tu oído.
          </p>
        </div>
      </div>

      <MixAdviceBoard
        simulationId={simulationId}
        stored={stored}
        provider={provider}
      />
    </section>
  );
}

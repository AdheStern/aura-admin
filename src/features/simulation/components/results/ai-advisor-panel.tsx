// src/features/simulation/components/results/ai-advisor-panel.tsx — la sección de criterio.
//
// Va la ÚLTIMA y enmarcada a propósito. Todo lo anterior —veredicto, alertas, recomendaciones,
// comprobaciones, cifras por banda, mapa— sale de fórmulas: el `+5.2 dB en 4 kHz` de una tarjeta lo
// calculó SourceEqRule con el desvío medido. Lo de aquí lo propone un modelo de lenguaje. Que un
// `ratio 3:1` y un `RT60 = 1.42 s` se vean distintos no es purismo: es lo que permite contestar de
// dónde sale cada cifra cuando lo pregunten, y por eso el rótulo no se puede quitar ni suavizar.
//
// Los dos consejos comparten marco y no tienen uno cada uno: el rótulo dice "esto lo propuso un
// modelo", y repetirlo dos veces lo convertiría en decoración que se deja de leer. Comparten también
// esta consulta de ajustes, que si no se haría dos veces por carga.
//
// Si no hay clave configurada la sección se pinta igual, con su explicación. Esconderla haría pensar
// que la función no existe.

import { FlaskConical } from "lucide-react";
import { getLlmSettings } from "@/features/settings/queries/get-llm-settings";
import { PROVIDER_LABELS } from "@/features/settings/schemas";
import { MixAdviceBoard } from "@/features/simulation/components/results/mix-advice-board";
import { PanelAdviceBoard } from "@/features/simulation/components/results/panel-advice-board";
import { getMixAdvice } from "@/features/simulation/queries/get-mix-advice";
import { getPanelAdvice } from "@/features/simulation/queries/get-panel-advice";

export async function AiAdvisorPanel({
  simulationId,
  userId,
}: {
  simulationId: string;
  userId: string;
}) {
  const [mix, panels, settings] = await Promise.all([
    getMixAdvice(simulationId),
    getPanelAdvice(simulationId),
    getLlmSettings(userId),
  ]);

  const provider =
    settings.hasApiKey && settings.provider
      ? PROVIDER_LABELS[settings.provider]
      : null;

  return (
    <section className="flex flex-col gap-5 rounded-md border border-dashed border-amber-500/50 bg-amber-500/5 p-4">
      <div className="flex items-start gap-2">
        <FlaskConical
          className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
        <div>
          <h2 className="font-heading text-lg font-semibold">Asesor con IA</h2>
          <p className="text-sm text-muted-foreground">
            Criterio propuesto por un modelo de lenguaje, no medido por el
            motor. Todo lo de arriba sale de fórmulas de acústica sobre esta
            simulación; esto no. Úsalo como punto de partida y contrástalo con
            tu oído.
          </p>
        </div>
      </div>

      <Block title="Mezcla" hint="Balance, ecualización y dinámica por canal.">
        <MixAdviceBoard
          simulationId={simulationId}
          stored={mix}
          provider={provider}
        />
      </Block>

      <Block
        title="Tratamiento acústico"
        hint="Dónde colgar los dos primeros paneles para bajar la reverberación."
      >
        <PanelAdviceBoard
          simulationId={simulationId}
          stored={panels}
          provider={provider}
        />
      </Block>
    </section>
  );
}

function Block({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-amber-500/20 pt-4 first-of-type:border-t-0 first-of-type:pt-0">
      <div>
        <h3 className="font-heading text-base font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {children}
    </div>
  );
}

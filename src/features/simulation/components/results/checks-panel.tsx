// src/features/simulation/components/results/checks-panel.tsx — qué se comprobó, dispare o no.
//
// Va DESPUÉS de las recomendaciones: quien abre resultados quiere primero lo que hay que hacer.
// Esta sección contesta la otra pregunta, la que hasta ahora no tenía respuesta en ninguna
// pantalla — "y lo que no sale ahí arriba, ¿está bien o es que no se mira?".
//
// Las que dispararon se marcan pero NO se repite su contenido: la tarjeta de arriba ya lo dice, y
// dos redacciones del mismo hallazgo obligan a comprobar que coinciden.

import { CircleCheck, CircleDot } from "lucide-react";
import type { RuleCheck } from "@/features/simulation/model/rule-roster";

export function ChecksPanel({ checks }: { checks: RuleCheck[] }) {
  if (checks.length === 0) return null;

  const firedCount = checks.filter((check) => check.fired).length;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold">Comprobaciones</h2>
      <p className="text-sm text-muted-foreground">
        Las {checks.length} reglas corren en cada simulación. {firedCount}{" "}
        tienen algo que decir de esta escena; el resto no encontró nada, que no
        es lo mismo que no mirarlo.
      </p>

      <ul className="divide-y rounded-md border">
        {checks.map((check) => (
          <CheckRow key={check.rule} check={check} />
        ))}
      </ul>
    </section>
  );
}

function CheckRow({ check }: { check: RuleCheck }) {
  const Icon = check.fired ? CircleDot : CircleCheck;

  return (
    <li className="flex items-start gap-3 p-3">
      <Icon
        className={
          check.fired
            ? "mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
            : "mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
        }
        aria-hidden
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-medium">{check.label}</span>
          <span className="text-xs text-muted-foreground">
            {check.fired ? "con recomendación" : "sin hallazgos"}
          </span>
        </div>
        {check.trigger ? (
          <span className="text-xs text-muted-foreground">{check.trigger}</span>
        ) : null}
      </div>
    </li>
  );
}

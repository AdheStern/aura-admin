// src/features/simulation/components/results/outdated-banner.tsx — "esto ya no es tu escena".
//
// Los resultados no se borran nunca al editar (§08): siguen siendo ciertos para el recinto con el
// que se calcularon. Lo que deja de ser cierto es que describan lo que hay ahora, y eso es lo que
// dice este cartel — sin él, un mapa viejo se lee como si fuera el actual.

import { History } from "lucide-react";
import Link from "next/link";
import type { OutdatedCheck } from "@/features/simulation/queries/is-simulation-outdated";

const MESSAGES: Record<Exclude<OutdatedCheck, "current">, string> = {
  outdated:
    "La escena cambió desde que se calculó esto. Los números siguen siendo válidos para el recinto de entonces, no para el de ahora.",
  unknown:
    "La escena ya no se puede compilar, así que no hay con qué comparar estos resultados. Revisa el recinto y el flujo de señal.",
};

export function OutdatedBanner({
  state,
  sceneHref,
}: {
  state: OutdatedCheck;
  sceneHref: string;
}) {
  if (state === "current") return null;

  return (
    <div className="flex flex-wrap items-start gap-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-4">
      <History
        className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden
      />
      <p className="flex-1 text-sm">
        {MESSAGES[state]}{" "}
        <Link
          href={sceneHref}
          className="font-medium underline underline-offset-4"
        >
          Volver a simular
        </Link>
      </p>
    </div>
  );
}

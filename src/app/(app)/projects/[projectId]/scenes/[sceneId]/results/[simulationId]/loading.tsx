// src/app/(app)/projects/[projectId]/scenes/[sceneId]/results/[simulationId]/loading.tsx
//
// Es la página más lenta de la app: lee las filas de resultado, recompila la escena para saber si
// siguen vigentes y resuelve el catálogo para las sugerencias de tratamiento. Sin esto, pulsar "Ver
// resultados" deja la pantalla anterior congelada y parece que el clic no llegó.
//
// El esqueleto tiene la FORMA de lo que viene —veredicto ancho arriba, dos tarjetas, un bloque de
// gráfico— para que la página no salte al llegar. Uno genérico centrado movería todo al aparecer.

import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingResults() {
  return (
    <div className="flex flex-col gap-8" aria-busy>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-72" />
      </div>

      <Skeleton className="h-24 w-full rounded-lg" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>

      <Skeleton className="h-72 w-full rounded-lg" />

      <span className="sr-only">Cargando los resultados de la simulación…</span>
    </div>
  );
}

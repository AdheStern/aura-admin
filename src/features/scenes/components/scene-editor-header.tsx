// src/features/scenes/components/scene-editor-header.tsx — la franja de título de los tres editores.
//
// Los editores ocupan la ventana entera, así que el nombre de la escena no cabe encima del lienzo:
// vive en esta franja, junto a las acciones. Una sola pieza para los tres porque pasar de flujo a
// recinto y a 3D tiene que sentirse como moverse dentro del mismo sitio, no entre tres pantallas
// que se parecen.
//
// `h-14` fija: el lienzo de debajo se mide contra el alto restante, y una franja que creciera al
// meterle un botón más desplazaría el lienzo sin que nada lo avisara.

import type { ReactNode } from "react";

export function SceneEditorHeader({
  sceneName,
  meta,
  children,
}: {
  sceneName: string;
  /** Detalle de una línea junto al nombre: cuántas cajas, qué hay seleccionado. */
  meta?: ReactNode;
  /** Acciones, alineadas a la derecha. */
  children?: ReactNode;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      <h1 className="truncate font-heading text-base font-semibold tracking-tight">
        {sceneName}
      </h1>
      {meta ? (
        <span className="truncate text-xs text-muted-foreground">{meta}</span>
      ) : null}
      <div className="ml-auto flex shrink-0 items-center gap-2">{children}</div>
    </header>
  );
}

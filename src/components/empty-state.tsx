// src/components/empty-state.tsx — una lista vacía, contada como lo que es.
//
// "Todavía no hay nada" describe la pantalla, no dice qué hacer. Cada estado vacío de esta app cae
// en un sitio donde SÍ hay un siguiente paso concreto, y esa frase es lo único que importa: quien
// llega aquí la primera vez no sabe si le falta permiso, si algo falló, o si simplemente le toca
// crear el primero.
//
// La acción se pasa como hijo en vez de recibir una URL: unas veces es un enlace y otras un diálogo,
// y quien monta el estado vacío ya tiene el componente que corresponde.

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: LucideIcon;
  title: string;
  /** El siguiente paso, en una frase. */
  hint: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
      <Icon className="size-8 text-muted-foreground" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="font-heading text-sm font-semibold">{title}</p>
        <p className="max-w-prose text-sm text-muted-foreground">{hint}</p>
      </div>
      {children}
    </div>
  );
}

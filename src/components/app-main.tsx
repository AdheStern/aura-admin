// src/components/app-main.tsx — decide si la página va acolchada o a sangre.
//
// Los tres editores (flujo, recinto 2D, recinto 3D) ocupan la ventana entera: su lienzo se mide
// contra el alto disponible y las herramientas van pegadas a los bordes. El resto de pantallas son
// documentos y quieren margen.
//
// Se decide por la RUTA y no con una prop de cada página porque el layout no puede recibir props de
// sus hijas. La alternativa —un grupo de rutas aparte con su propio layout— duplicaría el armazón
// entero (sidebar, cabecera, sesión) para cambiar dos clases.

"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** `/projects/:id/scenes/:id/flow` · `.../room` · `.../room/3d` */
const EDITOR_ROUTE = /\/scenes\/[^/]+\/(flow|room)(\/3d)?$/;

export function AppMain({ children }: { children: ReactNode }) {
  if (EDITOR_ROUTE.test(usePathname())) {
    // `min-h-0` es lo que permite que el hijo se encoja: sin él, un lienzo que crece empuja el
    // contenedor y aparece un scroll en toda la página en vez de quedarse dentro del editor.
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    );
  }

  // El scroll vive AQUÍ y no en la ventana: la cabecera es `sticky` dentro de un contenedor de
  // alto fijo, y si la página entera se desplazara se iría con ella.
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-8 sm:px-10">
      {children}
    </main>
  );
}

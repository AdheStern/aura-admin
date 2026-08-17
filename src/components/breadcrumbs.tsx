// src/components/breadcrumbs.tsx — el rastro de dónde estás, en la cabecera.
//
// Se deriva de la RUTA y no de props que cada página tenga que pasar: así ninguna pantalla puede
// olvidarse de ponerlo, que es como estos rastros acaban desapareciendo a medias.
//
// Los ids NO se enseñan nunca: un cuid en pantalla no le dice nada a nadie. El nombre real —el
// proyecto, la escena— ya está en el `h1` de la propia página, así que aquí el id solo aporta su
// ENLACE, con una etiqueta genérica ("Proyecto", "Escena"). Sin eso, desde un editor no habría
// forma de volver al proyecto en un clic.

"use client";

import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATALOG_TYPES } from "@/features/catalogs/catalog-types";

const SEGMENT_LABELS: Record<string, string> = {
  projects: "Proyectos",
  catalogs: "Catálogos",
  settings: "Ajustes",
  flow: "Flujo de señal",
  room: "Recinto",
  "3d": "3D",
  results: "Resultados",
  ...Object.fromEntries(CATALOG_TYPES.map((type) => [type.slug, type.label])),
};

/** Cómo se rotula el id que va DETRÁS de cada colección. Lo que no esté aquí se omite. */
const ID_LABELS: Record<string, string> = {
  projects: "Proyecto",
  scenes: "Escena",
};

/** Colecciones sin página propia: `/projects/x/scenes` no existe, solo sus hijas. */
const NO_PAGE = new Set(["scenes"]);

/** La escena tampoco tiene página raíz: su puerta de entrada es el editor de flujo. */
const ENTRY_POINT: Record<string, string> = { scenes: "/flow" };

type Crumb = { label: string; href: string };

export function Breadcrumbs() {
  const crumbs = toCrumbs(usePathname());
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Ruta" className="hidden min-w-0 sm:block">
      <ol className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
            {index > 0 ? (
              <ChevronRightIcon
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
            ) : null}
            {index === crumbs.length - 1 ? (
              <span aria-current="page" className="truncate font-medium">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="truncate text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function toCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];

  for (const [index, segment] of segments.entries()) {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label = SEGMENT_LABELS[segment];

    if (label) {
      if (!NO_PAGE.has(segment)) crumbs.push({ label, href });
      continue;
    }

    // Un segmento sin etiqueta es un id: se rotula por la colección que lo precede.
    const parent = segments[index - 1];
    const idLabel = parent ? ID_LABELS[parent] : undefined;
    if (idLabel) {
      crumbs.push({ label: idLabel, href: href + (ENTRY_POINT[parent] ?? "") });
    }
  }

  // "Escena" apunta al editor de flujo, así que estando en él quedaban dos migas seguidas al mismo
  // destino. Se queda la última, que es la que nombra dónde estás.
  return crumbs.filter(
    (crumb, index) => crumb.href !== crumbs[index + 1]?.href,
  );
}

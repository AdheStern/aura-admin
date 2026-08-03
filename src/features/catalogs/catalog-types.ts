// src/features/catalogs/catalog-types.ts — registro único de los tipos de catálogo que existen.
// Lo consumen el submenú del sidebar y el índice de /catalogs: sin él, dar de alta un tipo exige
// recordar dos sitios que NO rompen el build si se olvidan — el catálogo quedaría inaccesible por
// navegación aunque sus rutas funcionaran. Extensión por registro, como el resto del proyecto.

import {
  AudioLinesIcon,
  type LucideIcon,
  MicIcon,
  PackageIcon,
  SlidersHorizontalIcon,
  SpeakerIcon,
} from "lucide-react";

export type CatalogType = {
  /** Segmento de ruta bajo /catalogs y clave estable del tipo. */
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const CATALOG_TYPES: readonly CatalogType[] = [
  {
    slug: "speakers",
    label: "Parlantes",
    description: "Datasheets de altavoces del catálogo.",
    icon: SpeakerIcon,
  },
  {
    slug: "microphones",
    label: "Micrófonos",
    description: "Respuesta, patrón polar y sensibilidad.",
    icon: MicIcon,
  },
  {
    slug: "consoles",
    label: "Consolas",
    description: "Canales, buses y rangos de ganancia.",
    icon: SlidersHorizontalIcon,
  },
  {
    slug: "amplifiers",
    label: "Amplificadores / PA",
    description: "Potencia por canal según la impedancia de carga.",
    icon: AudioLinesIcon,
  },
  {
    slug: "materials",
    label: "Materiales",
    description: "Coeficientes de absorción y dispersión por banda.",
    icon: PackageIcon,
  },
] as const;

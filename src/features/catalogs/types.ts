// src/features/catalogs/types.ts

import type { MaterialSpec } from "@/contracts/material-spec.schema";

/** Los cuatro catálogos de equipo comparten columnas planas: se identifican por marca+modelo. */
export type CatalogEquipmentListItem = {
  id: string;
  brand: string;
  model: string;
  category: string;
  verified: boolean;
  updatedAt: Date;
};

export type CatalogEquipmentDetail<TSpec> = {
  id: string;
  brand: string;
  model: string;
  category: string;
  verified: boolean;
  specVersion: string;
  /** null si specVersion no es la soportada por este build de la UI. */
  spec: TSpec | null;
  specRaw: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export type CatalogMaterialListItem = {
  id: string;
  name: string;
  category: string;
  verified: boolean;
  updatedAt: Date;
};

export type CatalogMaterialDetail = {
  id: string;
  name: string;
  category: string;
  verified: boolean;
  specVersion: string;
  spec: MaterialSpec | null;
  specRaw: unknown;
  createdAt: Date;
  updatedAt: Date;
};

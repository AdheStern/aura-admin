// src/features/catalogs/types.ts
//
// Dos formas de identidad, no seis: los cuatro catálogos de equipo se identifican por marca+modelo
// y los dos "nombrados" (materiales y fuentes) por el `name` de su propio spec.

/** Equipo: parlantes, micrófonos, consolas y amplificadores. */
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

/** Nombrados: materiales y fuentes. */
export type CatalogNamedListItem = {
  id: string;
  name: string;
  category: string;
  verified: boolean;
  updatedAt: Date;
};

export type CatalogNamedDetail<TSpec> = {
  id: string;
  name: string;
  category: string;
  verified: boolean;
  specVersion: string;
  spec: TSpec | null;
  specRaw: unknown;
  createdAt: Date;
  updatedAt: Date;
};

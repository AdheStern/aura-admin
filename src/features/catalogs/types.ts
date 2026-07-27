// src/features/catalogs/types.ts

import type { MaterialSpec } from "@/contracts/material-spec.schema";
import type { SpeakerSpec } from "@/contracts/speaker-spec.schema";

export type CatalogSpeakerListItem = {
  id: string;
  brand: string;
  model: string;
  category: string;
  verified: boolean;
  updatedAt: Date;
};

export type CatalogSpeakerDetail = {
  id: string;
  brand: string;
  model: string;
  category: string;
  verified: boolean;
  specVersion: string;
  spec: SpeakerSpec | null; // null si specVersion no es la soportada por este build de la UI
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

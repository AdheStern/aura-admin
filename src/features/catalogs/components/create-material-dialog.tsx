// src/features/catalogs/components/create-material-dialog.tsx

"use client";

import { EXAMPLE_MATERIAL_SPEC } from "@/contracts/examples";
import { materialSpecSchema } from "@/contracts/material-spec.schema";
import { createMaterial } from "@/features/catalogs/actions";
import { CatalogDialog } from "@/features/catalogs/components/catalog-dialog";
import { SpecFormFields } from "@/features/catalogs/components/spec-form-fields";

export function CreateMaterialDialog() {
  return (
    <CatalogDialog
      triggerLabel="+ Nuevo material"
      title="Nuevo material"
      formId="create-material-form"
      submitLabel="Crear material"
      pendingLabel="Creando…"
      onSubmit={(formData) =>
        createMaterial(String(formData.get("specJson") ?? ""))
      }
    >
      <SpecFormFields
        schema={materialSpecSchema}
        defaultSpecJson={JSON.stringify(EXAMPLE_MATERIAL_SPEC, null, 2)}
      />
    </CatalogDialog>
  );
}

// src/features/catalogs/components/create-source-dialog.tsx

"use client";

import { EXAMPLE_SOURCE_SPEC } from "@/contracts/examples";
import { sourceSpecSchema } from "@/contracts/source-spec.schema";
import { createSource } from "@/features/catalogs/actions";
import { CatalogDialog } from "@/features/catalogs/components/catalog-dialog";
import { SpecFormFields } from "@/features/catalogs/components/spec-form-fields";

export function CreateSourceDialog() {
  return (
    <CatalogDialog
      triggerLabel="+ Nueva fuente"
      title="Nueva fuente"
      formId="create-source-form"
      submitLabel="Crear fuente"
      pendingLabel="Creando…"
      onSubmit={(formData) =>
        createSource(String(formData.get("specJson") ?? ""))
      }
    >
      <SpecFormFields
        schema={sourceSpecSchema}
        defaultSpecJson={JSON.stringify(EXAMPLE_SOURCE_SPEC, null, 2)}
      />
    </CatalogDialog>
  );
}

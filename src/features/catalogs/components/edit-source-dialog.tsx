// src/features/catalogs/components/edit-source-dialog.tsx

"use client";

import { useState } from "react";
import { sourceSpecSchema } from "@/contracts/source-spec.schema";
import { updateSource } from "@/features/catalogs/actions";
import { CatalogDialog } from "@/features/catalogs/components/catalog-dialog";
import { SpecFormFields } from "@/features/catalogs/components/spec-form-fields";

export function EditSourceDialog({
  sourceId,
  specJson,
  initialVerified,
}: {
  sourceId: string;
  specJson: string;
  initialVerified: boolean;
}) {
  const [verified, setVerified] = useState(initialVerified);

  return (
    <CatalogDialog
      triggerLabel="Editar"
      triggerVariant="outline"
      title="Editar fuente"
      formId="edit-source-form"
      submitLabel="Guardar cambios"
      pendingLabel="Guardando…"
      onSubmit={(formData) =>
        updateSource(sourceId, String(formData.get("specJson") ?? ""), verified)
      }
    >
      <SpecFormFields
        schema={sourceSpecSchema}
        defaultSpecJson={specJson}
        verified={{ checked: verified, onCheckedChange: setVerified }}
      />
    </CatalogDialog>
  );
}

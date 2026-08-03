// src/features/catalogs/components/edit-material-dialog.tsx

"use client";

import { useState } from "react";
import { updateMaterial } from "@/features/catalogs/actions";
import { CatalogDialog } from "@/features/catalogs/components/catalog-dialog";
import { MaterialFormFields } from "@/features/catalogs/components/material-form-fields";

export function EditMaterialDialog({
  materialId,
  specJson,
  initialVerified,
}: {
  materialId: string;
  specJson: string;
  initialVerified: boolean;
}) {
  const [verified, setVerified] = useState(initialVerified);

  return (
    <CatalogDialog
      triggerLabel="Editar"
      triggerVariant="outline"
      title="Editar material"
      formId="edit-material-form"
      submitLabel="Guardar cambios"
      pendingLabel="Guardando…"
      onSubmit={(formData) =>
        updateMaterial(
          materialId,
          String(formData.get("specJson") ?? ""),
          verified,
        )
      }
    >
      <MaterialFormFields
        defaultSpecJson={specJson}
        verified={{ checked: verified, onCheckedChange: setVerified }}
      />
    </CatalogDialog>
  );
}

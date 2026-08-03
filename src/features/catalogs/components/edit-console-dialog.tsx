// src/features/catalogs/components/edit-console-dialog.tsx

"use client";

import { useState } from "react";
import { consoleSpecSchema } from "@/contracts/console-spec.schema";
import { updateConsole } from "@/features/catalogs/actions";
import { CatalogDialog } from "@/features/catalogs/components/catalog-dialog";
import { EquipmentFormFields } from "@/features/catalogs/components/equipment-form-fields";

export function EditConsoleDialog({
  consoleId,
  brand,
  model,
  specJson,
  initialVerified,
}: {
  consoleId: string;
  brand: string;
  model: string;
  specJson: string;
  initialVerified: boolean;
}) {
  const [verified, setVerified] = useState(initialVerified);

  return (
    <CatalogDialog
      triggerLabel="Editar"
      triggerVariant="outline"
      title="Editar consola"
      formId="edit-console-form"
      submitLabel="Guardar cambios"
      pendingLabel="Guardando…"
      onSubmit={(formData) =>
        updateConsole(
          consoleId,
          String(formData.get("brand") ?? ""),
          String(formData.get("model") ?? ""),
          String(formData.get("specJson") ?? ""),
          verified,
        )
      }
    >
      <EquipmentFormFields
        schema={consoleSpecSchema}
        defaultBrand={brand}
        defaultModel={model}
        defaultSpecJson={specJson}
        verified={{ checked: verified, onCheckedChange: setVerified }}
      />
    </CatalogDialog>
  );
}

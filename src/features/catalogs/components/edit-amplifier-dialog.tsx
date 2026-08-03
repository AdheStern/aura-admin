// src/features/catalogs/components/edit-amplifier-dialog.tsx

"use client";

import { useState } from "react";
import { amplifierSpecSchema } from "@/contracts/amplifier-spec.schema";
import { updateAmplifier } from "@/features/catalogs/actions";
import { CatalogDialog } from "@/features/catalogs/components/catalog-dialog";
import { EquipmentFormFields } from "@/features/catalogs/components/equipment-form-fields";

export function EditAmplifierDialog({
  amplifierId,
  brand,
  model,
  specJson,
  initialVerified,
}: {
  amplifierId: string;
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
      title="Editar amplificador"
      formId="edit-amplifier-form"
      submitLabel="Guardar cambios"
      pendingLabel="Guardando…"
      onSubmit={(formData) =>
        updateAmplifier(
          amplifierId,
          String(formData.get("brand") ?? ""),
          String(formData.get("model") ?? ""),
          String(formData.get("specJson") ?? ""),
          verified,
        )
      }
    >
      <EquipmentFormFields
        schema={amplifierSpecSchema}
        defaultBrand={brand}
        defaultModel={model}
        defaultSpecJson={specJson}
        verified={{ checked: verified, onCheckedChange: setVerified }}
      />
    </CatalogDialog>
  );
}

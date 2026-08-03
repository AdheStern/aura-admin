// src/features/catalogs/components/edit-microphone-dialog.tsx

"use client";

import { useState } from "react";
import { microphoneSpecSchema } from "@/contracts/microphone-spec.schema";
import { updateMicrophone } from "@/features/catalogs/actions";
import { CatalogDialog } from "@/features/catalogs/components/catalog-dialog";
import { EquipmentFormFields } from "@/features/catalogs/components/equipment-form-fields";

export function EditMicrophoneDialog({
  microphoneId,
  brand,
  model,
  specJson,
  initialVerified,
}: {
  microphoneId: string;
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
      title="Editar micrófono"
      formId="edit-microphone-form"
      submitLabel="Guardar cambios"
      pendingLabel="Guardando…"
      onSubmit={(formData) =>
        updateMicrophone(
          microphoneId,
          String(formData.get("brand") ?? ""),
          String(formData.get("model") ?? ""),
          String(formData.get("specJson") ?? ""),
          verified,
        )
      }
    >
      <EquipmentFormFields
        schema={microphoneSpecSchema}
        defaultBrand={brand}
        defaultModel={model}
        defaultSpecJson={specJson}
        verified={{ checked: verified, onCheckedChange: setVerified }}
      />
    </CatalogDialog>
  );
}

// src/features/catalogs/components/edit-speaker-dialog.tsx

"use client";

import { useState } from "react";
import { speakerSpecSchema } from "@/contracts/speaker-spec.schema";
import { updateSpeaker } from "@/features/catalogs/actions";
import { CatalogDialog } from "@/features/catalogs/components/catalog-dialog";
import { EquipmentFormFields } from "@/features/catalogs/components/equipment-form-fields";

export function EditSpeakerDialog({
  speakerId,
  brand,
  model,
  specJson,
  initialVerified,
}: {
  speakerId: string;
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
      title="Editar parlante"
      formId="edit-speaker-form"
      submitLabel="Guardar cambios"
      pendingLabel="Guardando…"
      onSubmit={(formData) =>
        updateSpeaker(
          speakerId,
          String(formData.get("brand") ?? ""),
          String(formData.get("model") ?? ""),
          String(formData.get("specJson") ?? ""),
          verified,
        )
      }
    >
      <EquipmentFormFields
        schema={speakerSpecSchema}
        defaultBrand={brand}
        defaultModel={model}
        defaultSpecJson={specJson}
        verified={{ checked: verified, onCheckedChange: setVerified }}
      />
    </CatalogDialog>
  );
}

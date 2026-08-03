// src/features/catalogs/components/create-speaker-dialog.tsx

"use client";

import { EXAMPLE_SPEAKER_SPEC } from "@/contracts/examples";
import { speakerSpecSchema } from "@/contracts/speaker-spec.schema";
import { createSpeaker } from "@/features/catalogs/actions";
import { CatalogDialog } from "@/features/catalogs/components/catalog-dialog";
import { EquipmentFormFields } from "@/features/catalogs/components/equipment-form-fields";

export function CreateSpeakerDialog() {
  return (
    <CatalogDialog
      triggerLabel="+ Nuevo parlante"
      title="Nuevo parlante"
      formId="create-speaker-form"
      submitLabel="Crear parlante"
      pendingLabel="Creando…"
      onSubmit={(formData) =>
        createSpeaker(
          String(formData.get("brand") ?? ""),
          String(formData.get("model") ?? ""),
          String(formData.get("specJson") ?? ""),
        )
      }
    >
      <EquipmentFormFields
        schema={speakerSpecSchema}
        defaultSpecJson={JSON.stringify(EXAMPLE_SPEAKER_SPEC, null, 2)}
      />
    </CatalogDialog>
  );
}

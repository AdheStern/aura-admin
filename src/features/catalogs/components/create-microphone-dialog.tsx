// src/features/catalogs/components/create-microphone-dialog.tsx

"use client";

import { EXAMPLE_MICROPHONE_SPEC } from "@/contracts/examples";
import { microphoneSpecSchema } from "@/contracts/microphone-spec.schema";
import { createMicrophone } from "@/features/catalogs/actions";
import { CatalogDialog } from "@/features/catalogs/components/catalog-dialog";
import { EquipmentFormFields } from "@/features/catalogs/components/equipment-form-fields";

export function CreateMicrophoneDialog() {
  return (
    <CatalogDialog
      triggerLabel="+ Nuevo micrófono"
      title="Nuevo micrófono"
      formId="create-microphone-form"
      submitLabel="Crear micrófono"
      pendingLabel="Creando…"
      onSubmit={(formData) =>
        createMicrophone(
          String(formData.get("brand") ?? ""),
          String(formData.get("model") ?? ""),
          String(formData.get("specJson") ?? ""),
        )
      }
    >
      <EquipmentFormFields
        schema={microphoneSpecSchema}
        defaultSpecJson={JSON.stringify(EXAMPLE_MICROPHONE_SPEC, null, 2)}
      />
    </CatalogDialog>
  );
}

// src/features/catalogs/components/create-amplifier-dialog.tsx

"use client";

import { amplifierSpecSchema } from "@/contracts/amplifier-spec.schema";
import { EXAMPLE_AMPLIFIER_SPEC } from "@/contracts/examples";
import { createAmplifier } from "@/features/catalogs/actions";
import { CatalogDialog } from "@/features/catalogs/components/catalog-dialog";
import { EquipmentFormFields } from "@/features/catalogs/components/equipment-form-fields";

export function CreateAmplifierDialog() {
  return (
    <CatalogDialog
      triggerLabel="+ Nuevo amplificador"
      title="Nuevo amplificador"
      formId="create-amplifier-form"
      submitLabel="Crear amplificador"
      pendingLabel="Creando…"
      onSubmit={(formData) =>
        createAmplifier(
          String(formData.get("brand") ?? ""),
          String(formData.get("model") ?? ""),
          String(formData.get("specJson") ?? ""),
        )
      }
    >
      <EquipmentFormFields
        schema={amplifierSpecSchema}
        defaultSpecJson={JSON.stringify(EXAMPLE_AMPLIFIER_SPEC, null, 2)}
      />
    </CatalogDialog>
  );
}

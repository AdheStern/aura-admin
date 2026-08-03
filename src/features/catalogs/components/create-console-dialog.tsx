// src/features/catalogs/components/create-console-dialog.tsx

"use client";

import { consoleSpecSchema } from "@/contracts/console-spec.schema";
import { EXAMPLE_CONSOLE_SPEC } from "@/contracts/examples";
import { createConsole } from "@/features/catalogs/actions";
import { CatalogDialog } from "@/features/catalogs/components/catalog-dialog";
import { EquipmentFormFields } from "@/features/catalogs/components/equipment-form-fields";

export function CreateConsoleDialog() {
  return (
    <CatalogDialog
      triggerLabel="+ Nueva consola"
      title="Nueva consola"
      formId="create-console-form"
      submitLabel="Crear consola"
      pendingLabel="Creando…"
      onSubmit={(formData) =>
        createConsole(
          String(formData.get("brand") ?? ""),
          String(formData.get("model") ?? ""),
          String(formData.get("specJson") ?? ""),
        )
      }
    >
      <EquipmentFormFields
        schema={consoleSpecSchema}
        defaultSpecJson={JSON.stringify(EXAMPLE_CONSOLE_SPEC, null, 2)}
      />
    </CatalogDialog>
  );
}

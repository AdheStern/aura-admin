// src/features/catalogs/components/spec-form-fields.tsx — campos de los catálogos que se
// identifican por el `name` de su propio spec (materiales y fuentes): solo el datasheet JSON.
// `verified` solo se pasa al editar — todo ítem nuevo entra sin verificar y marcarlo es un paso
// posterior de revisión (regla 4 de ingesta), así que el alta ni siquiera muestra la casilla.

import type { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SpecJsonField } from "@/features/catalogs/components/spec-json-field";

export function SpecFormFields<T>({
  schema,
  defaultSpecJson,
  verified,
}: {
  schema: z.ZodType<T>;
  defaultSpecJson: string;
  verified?: { checked: boolean; onCheckedChange: (checked: boolean) => void };
}) {
  return (
    <div className="flex flex-col gap-4">
      <SpecJsonField
        schema={schema}
        name="specJson"
        label="Datasheet (JSON)"
        defaultValue={defaultSpecJson}
      />
      {verified ? (
        <div className="flex items-center gap-2 text-sm">
          <Checkbox
            id="verified"
            checked={verified.checked}
            onCheckedChange={verified.onCheckedChange}
          />
          <Label htmlFor="verified">Verificado</Label>
        </div>
      ) : null}
    </div>
  );
}

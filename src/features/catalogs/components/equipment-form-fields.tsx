// src/features/catalogs/components/equipment-form-fields.tsx — campos comunes a los cuatro
// catálogos de equipo: marca, modelo y el datasheet JSON. `verified` solo se pasa al editar —
// todo ítem nuevo entra sin verificar y marcarlo es un paso posterior de revisión (regla 4 de
// ingesta), así que el alta ni siquiera muestra la casilla.

import type { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpecJsonField } from "@/features/catalogs/components/spec-json-field";

export function EquipmentFormFields<T>({
  schema,
  defaultBrand = "",
  defaultModel = "",
  defaultSpecJson,
  verified,
}: {
  schema: z.ZodType<T>;
  defaultBrand?: string;
  defaultModel?: string;
  defaultSpecJson: string;
  verified?: { checked: boolean; onCheckedChange: (checked: boolean) => void };
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" name="brand" defaultValue={defaultBrand} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" name="model" defaultValue={defaultModel} required />
        </div>
      </div>
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

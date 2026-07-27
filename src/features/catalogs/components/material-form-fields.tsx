// src/features/catalogs/components/material-form-fields.tsx

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { materialSpecSchema } from "@/contracts/material-spec.schema";
import { SpecJsonField } from "@/features/catalogs/components/spec-json-field";

export function MaterialFormFields({
  defaultSpecJson,
  verified,
}: {
  defaultSpecJson: string;
  verified?: { checked: boolean; onCheckedChange: (checked: boolean) => void };
}) {
  return (
    <div className="flex flex-col gap-4">
      <SpecJsonField
        schema={materialSpecSchema}
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

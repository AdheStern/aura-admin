// src/features/catalogs/components/speaker-form-fields.tsx

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { speakerSpecSchema } from "@/contracts/speaker-spec.schema";
import { SpecJsonField } from "@/features/catalogs/components/spec-json-field";

export function SpeakerFormFields({
  defaultBrand = "",
  defaultModel = "",
  defaultSpecJson,
  verified,
}: {
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
        schema={speakerSpecSchema}
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

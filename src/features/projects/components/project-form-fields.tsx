// src/features/projects/components/project-form-fields.tsx — campos compartidos create/edit

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ProjectFormFields({
  defaultName = "",
  defaultDescription = "",
}: {
  defaultName?: string;
  defaultDescription?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" defaultValue={defaultName} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaultDescription}
          rows={3}
        />
      </div>
    </div>
  );
}

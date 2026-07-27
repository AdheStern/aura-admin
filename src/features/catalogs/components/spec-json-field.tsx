// src/features/catalogs/components/spec-json-field.tsx — textarea JSON + validación zod inline,
// genérico sobre el schema (mismo patrón para parlantes y materiales).

"use client";

import { useState } from "react";
import type { z } from "zod";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseSpecJson } from "@/features/catalogs/schemas/parse-spec-json";

export function SpecJsonField<T>({
  schema,
  name,
  label,
  defaultValue,
}: {
  schema: z.ZodType<T>;
  name: string;
  label: string;
  defaultValue: string;
}) {
  const [error, setError] = useState<string | null>(null);

  function handleBlur(event: React.FocusEvent<HTMLTextAreaElement>) {
    const result = parseSpecJson(schema, event.target.value);
    setError(result.ok ? null : result.message);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        onBlur={handleBlur}
        rows={16}
        className="font-mono text-xs"
        required
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

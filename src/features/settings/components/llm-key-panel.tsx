// src/features/settings/components/llm-key-panel.tsx — el panel de API key del LLM (Fase 6, tarea 3).
//
// El campo llega SIEMPRE vacío, también cuando hay clave guardada: no se recibe del servidor, así
// que no hay forma de que se filtre por el HTML ni por un gestor de contraseñas. Lo que se enseña
// de la guardada son sus últimos cuatro caracteres, lo justo para reconocerla.

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { removeLlmKey } from "@/features/settings/actions/remove-llm-key";
import { saveLlmSettings } from "@/features/settings/actions/save-llm-settings";
import type { LlmSettings } from "@/features/settings/queries/get-llm-settings";
import {
  llmProviderSchema,
  PROVIDER_LABELS,
} from "@/features/settings/schemas";

type PanelState = { error: string | null; saved: boolean };

export function LlmKeyPanel({ settings }: { settings: LlmSettings }) {
  const [state, action, isPending] = useActionState<PanelState, FormData>(
    async (_previous, formData) => {
      const provider = llmProviderSchema.safeParse(formData.get("provider"));
      if (!provider.success) {
        return { error: "Elegí un proveedor", saved: false };
      }

      const typed = String(formData.get("apiKey") ?? "").trim();
      const result = await saveLlmSettings({
        provider: provider.data,
        apiKey: typed === "" ? undefined : typed,
      });

      return result.ok
        ? { error: null, saved: true }
        : { error: result.error.message, saved: false };
    },
    { error: null, saved: false },
  );

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="provider">Proveedor</Label>
          <Select name="provider" defaultValue={settings.provider ?? undefined}>
            <SelectTrigger id="provider">
              <SelectValue placeholder="Elegí un proveedor" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="apiKey">API key</Label>
          <Input
            id="apiKey"
            name="apiKey"
            type="password"
            autoComplete="off"
            placeholder={placeholderFor(settings)}
          />
          <p className="text-xs text-muted-foreground">
            Se guarda cifrada y no vuelve a mostrarse. Dejalo vacío para
            conservar la que ya está.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar"}
          </Button>
          {state.saved ? (
            <span className="text-xs text-muted-foreground">Guardado.</span>
          ) : null}
          {state.error ? (
            <span className="text-xs text-destructive">{state.error}</span>
          ) : null}
        </div>
      </form>

      {settings.hasApiKey ? <RemoveKeyForm settings={settings} /> : null}
    </div>
  );
}

function RemoveKeyForm({ settings }: { settings: LlmSettings }) {
  const [, action, isPending] = useActionState(async () => {
    await removeLlmKey();
    return null;
  }, null);

  return (
    <form action={action} className="flex items-center gap-3 border-t pt-4">
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        {isPending ? "Quitando…" : "Quitar la clave"}
      </Button>
      <span className="text-xs text-muted-foreground">
        {settings.apiKeyHint
          ? `Hay una clave guardada (…${settings.apiKeyHint}).`
          : "Hay una clave guardada, pero ya no se puede descifrar: guardá una nueva."}
      </span>
    </form>
  );
}

function placeholderFor(settings: LlmSettings): string {
  if (!settings.hasApiKey) return "sk-…";
  return settings.apiKeyHint ? `Guardada …${settings.apiKeyHint}` : "Guardada";
}

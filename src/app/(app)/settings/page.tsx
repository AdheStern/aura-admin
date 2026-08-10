// src/app/(app)/settings/page.tsx — preferencias del usuario (Sección 5, Fase 6).
// Por ahora solo la API key del LLM; unidades y modo por defecto están en el modelo pero todavía
// no los lee nadie.

import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LlmKeyPanel } from "@/features/settings/components/llm-key-panel";
import { getLlmSettings } from "@/features/settings/queries/get-llm-settings";
import { getActiveUser } from "@/lib/session";

export default async function SettingsPage() {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) redirect("/login");

  const settings = await getLlmSettings(activeUser.data.id);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Ajustes
        </h1>
        <p className="text-sm text-muted-foreground">{activeUser.data.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Explicaciones con IA</CardTitle>
          <CardDescription>
            Con tu propia clave, las recomendaciones se redactan con un modelo
            de lenguaje. Las cifras y la acción sugerida las calcula el motor en
            cualquier caso: la IA solo escribe el texto, y sin clave se usan
            plantillas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LlmKeyPanel settings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}

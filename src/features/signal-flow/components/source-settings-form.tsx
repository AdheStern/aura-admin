// src/features/signal-flow/components/source-settings-form.tsx — cómo sale la fuente hacia la
// consola. Al elegir un teclado o piano el editor arranca en estéreo, pero es un punto de partida:
// el mismo instrumento se monta sumado a mono cuando no sobran canales, y esa decisión es de la
// escena, no del instrumento.

"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  SourceNodeData,
  SourceOutputMode,
} from "@/features/signal-flow/schemas/node-data";
import { useFlowStore } from "@/features/signal-flow/store/flow-store-provider";

const OUTPUT_MODE_LABEL: Record<SourceOutputMode, string> = {
  mono: "Mono — una salida de línea",
  stereo: "Estéreo — salidas L y R",
};

export function SourceSettingsForm({
  nodeId,
  data,
}: {
  nodeId: string;
  data: SourceNodeData;
}) {
  const setSourceOutputMode = useFlowStore(
    (state) => state.setSourceOutputMode,
  );
  const canManage = useFlowStore((state) => state.canManage);

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase">
        Ajustes de escena
      </h3>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="source-output-mode">Salida</Label>
        <Select
          items={OUTPUT_MODE_LABEL}
          value={data.outputMode}
          disabled={!canManage}
          onValueChange={(value) => {
            if (value) setSourceOutputMode(nodeId, value as SourceOutputMode);
          }}
        >
          <SelectTrigger id="source-output-mode" size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(
              Object.entries(OUTPUT_MODE_LABEL) as [SourceOutputMode, string][]
            ).map(([mode, label]) => (
              <SelectItem key={mode} value={mode}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] leading-snug text-muted-foreground">
          En estéreo el nodo expone dos conectores de línea; pasar a mono deja
          suelto el cable de la derecha.
        </p>
      </div>
    </div>
  );
}

// src/features/signal-flow/components/specs-panel.tsx — columna lateral fija (no un Sheet
// superpuesto: la Sección 5.1 lo describe como panel siempre presente al seleccionar un nodo, no
// un drawer modal). Sin selección, muestra el veredicto del validador; con selección, el datasheet
// del equipo elegido — reusando tal cual los componentes de catalogs/components/, indexados por
// kind, igual que ya hace cada página de detalle de catálogo.

"use client";

import { AmplifierDatasheet } from "@/features/catalogs/components/amplifier-datasheet";
import { ConsoleDatasheet } from "@/features/catalogs/components/console-datasheet";
import { MicrophoneDatasheet } from "@/features/catalogs/components/microphone-datasheet";
import { SourceDatasheet } from "@/features/catalogs/components/source-datasheet";
import { SpeakerDatasheet } from "@/features/catalogs/components/speaker-datasheet";
import { useResolvedNode } from "@/features/signal-flow/components/nodes/node-hooks";
import { SpeakerElectricalSummary } from "@/features/signal-flow/components/speaker-electrical-summary";
import { SpeakerSettingsForm } from "@/features/signal-flow/components/speaker-settings-form";
import { ValidationSummary } from "@/features/signal-flow/components/validation-summary";
import type { FlowRfNode } from "@/features/signal-flow/mapping/react-flow-adapter";
import { flowNodeLabel } from "@/features/signal-flow/model/node-registry";
import type { ResolvedNode } from "@/features/signal-flow/model/resolved-flow";
import { useFlowStore } from "@/features/signal-flow/store/flow-store-provider";

export function SpecsPanel() {
  const selectedNode = useFlowStore(
    (state) =>
      state.nodes.find((node) => node.id === state.selectedNodeId) ?? null,
  );

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l bg-background p-4">
      {selectedNode ? (
        <SelectedNodePanel node={selectedNode} />
      ) : (
        <>
          <h2 className="font-heading text-sm font-medium">
            Estado del sistema
          </h2>
          <ValidationSummary />
        </>
      )}
    </aside>
  );
}

function SelectedNodePanel({ node }: { node: FlowRfNode }) {
  const resolved = useResolvedNode(node.id, node.data);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-sm font-medium">
        {flowNodeLabel(node.data.kind)}
      </h2>
      {node.data.kind === "simulation" ? (
        <ValidationSummary />
      ) : (
        <DatasheetOrNotice resolved={resolved} />
      )}
      {node.data.kind === "speaker" ? (
        <>
          <SpeakerElectricalSummary nodeId={node.id} />
          <SpeakerSettingsForm nodeId={node.id} data={node.data} />
        </>
      ) : null}
    </div>
  );
}

function DatasheetOrNotice({ resolved }: { resolved: ResolvedNode }) {
  if (resolved.specStatus === "not_selected") {
    return (
      <p className="text-sm text-muted-foreground">
        Elige un equipo del catálogo en el nodo.
      </p>
    );
  }
  if (resolved.specStatus === "item_missing") {
    return (
      <p className="text-sm text-destructive">
        El equipo elegido ya no está en el catálogo.
      </p>
    );
  }
  if (resolved.specStatus === "unsupported_version") {
    return (
      <p className="text-sm text-destructive">
        El datasheet usa una versión de contrato que esta app no sabe leer.
      </p>
    );
  }
  // specStatus === "resolved" implica spec no nulo, pero es un campo hermano y TS no correlaciona
  // ambos automáticamente: esta guarda es la que de verdad estrecha `spec` de TSpec|null a TSpec.
  if (!resolved.spec) return null;

  switch (resolved.kind) {
    case "source":
      return <SourceDatasheet spec={resolved.spec} />;
    case "microphone":
      return <MicrophoneDatasheet spec={resolved.spec} />;
    case "console":
      return <ConsoleDatasheet spec={resolved.spec} />;
    case "pa":
      return <AmplifierDatasheet spec={resolved.spec} />;
    case "speaker":
      return <SpeakerDatasheet spec={resolved.spec} />;
    default:
      return null;
  }
}

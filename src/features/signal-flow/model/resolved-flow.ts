// src/features/signal-flow/model/resolved-flow.ts — el grafo con los datasheets del catálogo ya
// resueltos. Todas las reglas (puertos, conexiones, validación) operan sobre esta forma, nunca
// sobre el documento crudo: sin el spec no se sabe cuántos puertos tiene una consola ni si una
// caja es activa.
//
// hydrateFlow es pura y toma el snapshot como argumento para que el editor —que ya tiene los specs
// en su store porque pinta el datasheet en el panel— construya el MISMO ResolvedFlow que el
// servidor construye desde Prisma. Una sola implementación de las reglas para cliente y servidor:
// la validación del cliente es feedback inmediato, la del servidor es la que cuenta, y no pueden
// discrepar porque son el mismo código.

import type { AmplifierSpec } from "@/contracts/amplifier-spec.schema";
import type { ConsoleSpec } from "@/contracts/console-spec.schema";
import type { MicrophoneSpec } from "@/contracts/microphone-spec.schema";
import type { SourceSpec } from "@/contracts/source-spec.schema";
import type { SpeakerSpec } from "@/contracts/speaker-spec.schema";
import type { FlowNodeKind } from "@/features/signal-flow/schemas/node-kinds";
import type {
  FlowEdge,
  FlowNode,
  SignalFlowDocument,
} from "@/features/signal-flow/schemas/signal-flow";

/** Datasheet de cualquiera de los cinco tipos de nodo que referencian catálogo. */
export type FlowCatalogSpec =
  | { kind: "source"; spec: SourceSpec }
  | { kind: "microphone"; spec: MicrophoneSpec }
  | { kind: "console"; spec: ConsoleSpec }
  | { kind: "pa"; spec: AmplifierSpec }
  | { kind: "speaker"; spec: SpeakerSpec };

export type SpecStatus =
  | "resolved"
  /** Nodo soltado en el lienzo sin ítem elegido todavía. */
  | "not_selected"
  /** El ítem existía al guardar el grafo y ya no está en el catálogo. */
  | "item_missing"
  /** La fila tiene una specVersion que este build no sabe leer. */
  | "unsupported_version"
  /** El nodo simulation no referencia catálogo. */
  | "not_applicable";

export type CatalogSnapshotEntry = FlowCatalogSpec | { kind: "unsupported" };

/** Clave `${kind}:${catalogItemId}`: el mismo id no se repite entre catálogos, pero el prefijo
 *  deja el mapa legible en los tests y evita colisiones si algún día se generan ids no-cuid. */
export type FlowCatalogSnapshot = ReadonlyMap<string, CatalogSnapshotEntry>;

export function catalogSnapshotKey(
  kind: FlowNodeKind,
  catalogItemId: string,
): string {
  return `${kind}:${catalogItemId}`;
}

type ResolvedOf<K extends FlowNodeKind, TSpec> = {
  id: string;
  position: { x: number; y: number };
  /** Duplica data.kind a propósito: TS solo discrimina uniones por una propiedad del nivel
   *  superior, y sin esto cada consumidor necesitaría un cast para leer su spec. */
  kind: K;
  data: Extract<FlowNode["data"], { kind: K }>;
  specStatus: SpecStatus;
  spec: TSpec | null;
};

export type ResolvedNode =
  | ResolvedOf<"source", SourceSpec>
  | ResolvedOf<"microphone", MicrophoneSpec>
  | ResolvedOf<"console", ConsoleSpec>
  | ResolvedOf<"pa", AmplifierSpec>
  | ResolvedOf<"speaker", SpeakerSpec>
  | ResolvedOf<"simulation", never>;

export type ResolvedFlow = {
  nodes: readonly ResolvedNode[];
  edges: readonly FlowEdge[];
};

export function hydrateFlow(
  document: SignalFlowDocument,
  snapshot: FlowCatalogSnapshot,
): ResolvedFlow {
  return {
    nodes: document.nodes.map((node) => resolveNode(node, snapshot)),
    edges: document.edges,
  };
}

function resolveNode(
  node: FlowNode,
  snapshot: FlowCatalogSnapshot,
): ResolvedNode {
  const resolved = resolveSpec(node, snapshot);

  // El cast es seguro por construcción: resolveSpec solo devuelve spec cuando la entrada del
  // snapshot es del mismo kind que el nodo. TS no puede correlacionar kind y spec en un objeto
  // literal, y escribir seis ramas idénticas para convencerlo no lo haría más cierto.
  return {
    id: node.id,
    position: node.position,
    kind: node.data.kind,
    data: node.data,
    ...resolved,
  } as ResolvedNode;
}

function resolveSpec(
  node: FlowNode,
  snapshot: FlowCatalogSnapshot,
): { specStatus: SpecStatus; spec: FlowCatalogSpec["spec"] | null } {
  if (node.data.kind === "simulation") {
    return { specStatus: "not_applicable", spec: null };
  }
  if (node.data.catalogItemId === null) {
    return { specStatus: "not_selected", spec: null };
  }

  const key = catalogSnapshotKey(node.data.kind, node.data.catalogItemId);
  const entry = snapshot.get(key);
  if (!entry) return { specStatus: "item_missing", spec: null };
  if (entry.kind !== node.data.kind) {
    return { specStatus: "unsupported_version", spec: null };
  }

  return { specStatus: "resolved", spec: entry.spec };
}

// src/features/signal-flow/store/flow-store-types.ts — tipos del store del editor de flujo,
// separados de flow-store.ts porque el archivo combinado (tipos + createFlowStore) pasaba de las
// 150 líneas que la Sección 9.3 fija como objetivo para un store Zustand.

import type {
  Connection,
  EdgeChange,
  NodeChange,
  Viewport,
  XYPosition,
} from "@xyflow/react";
import type { SceneStatus } from "@/features/scenes/schemas";
import type {
  FlowRfEdge,
  FlowRfNode,
} from "@/features/signal-flow/mapping/react-flow-adapter";
import type { FlowCatalogLibrary } from "@/features/signal-flow/queries/list-flow-catalog-library";
import type { SourceOutputMode } from "@/features/signal-flow/schemas/node-data";
import type { FlowNodeKind } from "@/features/signal-flow/schemas/node-kinds";
import type { SignalFlowValidation } from "@/features/signal-flow/validation/validate-signal-flow";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type SpeakerSettingsPatch = Partial<{
  levelDb: number;
  polarityInverted: boolean;
  delayMs: number;
}>;

export type FlowStoreState = {
  sceneId: string;
  canManage: boolean;
  nodes: FlowRfNode[];
  edges: FlowRfEdge[];
  viewport: Viewport;
  library: FlowCatalogLibrary;
  selectedNodeId: string | null;
  validation: SignalFlowValidation;
  sceneStatus: SceneStatus;
  saveStatus: SaveStatus;

  onNodesChange: (changes: NodeChange<FlowRfNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowRfEdge>[]) => void;
  isValidConnection: (connection: Connection | FlowRfEdge) => boolean;
  connect: (connection: Connection) => void;
  setViewport: (viewport: Viewport) => void;
  addNode: (kind: FlowNodeKind, position: XYPosition) => void;
  deleteNode: (nodeId: string) => void;
  setNodeCatalogItem: (nodeId: string, catalogItemId: string | null) => void;
  setSourceOutputMode: (nodeId: string, mode: SourceOutputMode) => void;
  updateSpeakerSettings: (nodeId: string, patch: SpeakerSettingsPatch) => void;
  selectNode: (nodeId: string | null) => void;
  setSaveStatus: (status: SaveStatus) => void;
  applySaveResult: (result: {
    status: SceneStatus;
    errors: SignalFlowValidation["errors"];
    warnings: SignalFlowValidation["warnings"];
  }) => void;
};

export type FlowStoreInit = Pick<
  FlowStoreState,
  | "sceneId"
  | "canManage"
  | "nodes"
  | "edges"
  | "viewport"
  | "library"
  | "sceneStatus"
  | "validation"
>;

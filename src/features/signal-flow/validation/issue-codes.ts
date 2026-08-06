// src/features/signal-flow/validation/issue-codes.ts — catálogo de problemas del grafo.
//
// La severidad vive aquí y solo aquí: es la que decide si la escena pasa a FLOW_READY (Sección 08),
// así que repartirla por los checks sería repartir la máquina de estados. La frontera es concreta:
// es ERROR lo que impide compilar el SimulationRequest (no se sabe qué potencia recibe una caja, no
// se sabe qué programa suena) y AVISO lo que solo delata un montaje raro pero simulable.

export type FlowIssueSeverity = "error" | "warning";

const ISSUE_SEVERITY = {
  SIMULATION_NODE_MISSING: "error",
  SIMULATION_NODE_DUPLICATED: "error",
  NO_SPEAKER_IN_SIMULATION: "error",
  NODE_WITHOUT_CATALOG_ITEM: "error",
  CATALOG_ITEM_MISSING: "error",
  CATALOG_SPEC_UNSUPPORTED: "error",
  PORT_OUT_OF_RANGE: "error",
  INVALID_CONNECTION: "error",
  PORT_OVERSUBSCRIBED: "error",
  CYCLE_DETECTED: "error",
  SPEAKER_WITHOUT_POWER: "error",
  SPEAKER_WITHOUT_SIGNAL: "error",
  AMP_LOAD_UNSUPPORTED: "error",
  SPEAKER_WITHOUT_PROGRAM: "error",

  SPEAKER_NOT_SIMULATED: "warning",
  AMP_LOAD_MISMATCH: "warning",
  AMP_POWER_MISMATCH: "warning",
  SOURCE_NOT_ROUTED: "warning",
  MICROPHONE_WITHOUT_SOURCE: "warning",
  UNAMPLIFIED_SOURCE_DIRECT_LINE: "warning",
  ORPHAN_NODE: "warning",
} as const satisfies Record<string, FlowIssueSeverity>;

export type FlowIssueCode = keyof typeof ISSUE_SEVERITY;

export type FlowIssue = {
  code: FlowIssueCode;
  severity: FlowIssueSeverity;
  /** En español: se muestra tal cual sobre el nodo o la arista señalada. */
  message: string;
  nodeId?: string;
  edgeId?: string;
};

export function flowIssue(
  code: FlowIssueCode,
  message: string,
  target?: { nodeId?: string; edgeId?: string },
): FlowIssue {
  return { code, severity: ISSUE_SEVERITY[code], message, ...target };
}

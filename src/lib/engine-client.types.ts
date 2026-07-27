// src/lib/engine-client.types.ts — contrato Facade del cliente del motor (Apéndice A.5 del doc maestro)

import type {
  EngineErrorEnvelope,
  SimulationRequest,
  SimulationResult,
} from "@/contracts";

export type EngineJobStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface EngineJobUpdate {
  status: EngineJobStatus;
  progress: number;
  result?: SimulationResult;
  error?: EngineErrorEnvelope["error"];
}

export interface EngineClient {
  submitSimulation(
    request: SimulationRequest,
    onUpdate: (update: EngineJobUpdate) => void,
  ): Promise<void>;
}

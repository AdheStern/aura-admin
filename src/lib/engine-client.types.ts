// src/lib/engine-client.types.ts — contrato Facade del cliente del motor (Apéndice A.5 del doc maestro)

import type {
  EngineErrorCode,
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

// Los seis códigos del contrato describen un payload que el motor sí llegó a leer. Estos tres
// nombran fallos anteriores o ajenos a ese momento, y por eso no están —ni deben estar— en
// engineErrorCodeSchema: se guardan en SimulationJob.error, que es de la app, no del contrato.
export type LocalJobErrorCode =
  | "UNAUTHORIZED"
  | "ENGINE_UNREACHABLE"
  | "TIMEOUT";

export type JobErrorCode = EngineErrorCode | LocalJobErrorCode;

export interface JobError {
  code: JobErrorCode;
  message: string;
  details?: unknown;
}

/** El motor rechazó el encolado, o no se le pudo hablar. El job nunca llegó a existir allí. */
export class EngineSubmitError extends Error {
  constructor(
    readonly code: JobErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "EngineSubmitError";
  }

  toJobError(): JobError {
    return { code: this.code, message: this.message, details: this.details };
  }
}

export interface EngineClient {
  /**
   * Encola la simulación. Vuelve cuando el motor la aceptó con un 202; lanza EngineSubmitError si
   * la rechazó o no respondió.
   *
   * No hay callback de progreso: el motor corre en otro proceso y sus actualizaciones entran por
   * /api/internal/jobs/:jobId. Un 202 solo dice que el payload es válido y el job está encolado —
   * un GEOMETRY_INVALID que solo se descubre al construir la sala llega después, por callback.
   */
  submitSimulation(request: SimulationRequest): Promise<void>;
}

// src/contracts/simulation-request.schema.ts — contrato v1 de SimulationRequest (Sección 07)
// Fuente de verdad TS de simulation-request.schema.json (copia espejo en aura-engine).
// Payload autocontenido (ADR-03): el motor no consulta la BD, mismo payload → mismo resultado.
// Estricto: un campo inesperado en el payload es un bug del compilador de escenas, y debe
// fallar con INVALID_PAYLOAD antes de quemar minutos de cómputo.

import { z } from "zod";
import { octaveBandHzSchema } from "./bands";
import { materialSpecSchema } from "./material-spec.schema";
import { roomGeometrySchema } from "./room-geometry.schema";
import { speakerSpecSchema } from "./speaker-spec.schema";

export const simulationConfigSchema = z.strictObject({
  mode: z.enum(["simple", "advanced"]),
  /** El modo simple compone métodos por su cuenta; en avanzado los elige el usuario. */
  methods: z.array(z.enum(["statistical", "hybrid", "direct_field"])).min(1),
  bands: z.array(octaveBandHzSchema).min(1),
  /** Orden de reflexiones especulares exactas. La UI avanzada ofrece 3–17. */
  ism: z.strictObject({ maxOrder: z.number().int().min(0).max(17) }).optional(),
  /** seed fija por defecto: el ray tracing debe ser reproducible para los golden files. */
  rayTracing: z
    .strictObject({
      nRays: z.number().int().positive(),
      seed: z.number().int(),
    })
    .optional(),
  grid: z.strictObject({
    resolutionM: z.number().positive(),
    earHeightM: z.number().positive(),
  }),
  /** complex considera fase y polaridad → detecta cancelaciones entre cajas. */
  summation: z.enum(["energy", "complex"]),
  /**
   * Rango objetivo de RT60 en segundos, [min, max]. Lo que evalúa `RtTargetRule`.
   *
   * Viaja como RANGO y no como `roomType` (ADR 0003): la taxonomía —"iglesia", "auditorio"— es
   * vocabulario de producto en español y vive en `aura-admin` como preset de UI. El motor no
   * necesita saber qué es una iglesia, necesita el rango. Además así el usuario puede teclear un
   * objetivo propio, que es el caso del cálculo inverso de la Sección 02, y añadir un tipo de sala
   * deja de exigir desplegar el motor.
   *
   * `null` significa "no evalúes RtTargetRule": una escena sin objetivo declarado no debe recibir
   * una recomendación de tratamiento contra un rango que nadie eligió.
   *
   * El `min <= max` NO viaja en el JSON Schema —no hay forma de expresarlo— así que lo comprueban
   * los dos lados por su cuenta: aquí para que el error salga en el formulario, y el motor otra vez
   * en su frontera. Sin esto un rango invertido pondría a toda banda a la vez por encima del máximo
   * y por debajo del mínimo. `min == max` sí vale: es el objetivo puntual del cálculo inverso.
   */
  rtTargetS: z
    .tuple([z.number().positive(), z.number().positive()])
    .refine(([min, max]) => min <= max, {
      message: "El objetivo de RT60 es un rango [mín, máx] y llegó invertido",
    })
    .nullable()
    .default(null),
});

export const simulationEnvironmentSchema = z.strictObject({
  // Rango físico razonable de recinto: fuera de aquí es un error de unidades, y c(T)
  // dejaría de tener sentido (c = 331.3 + 0.606·T).
  temperatureC: z.number().min(-20).max(60),
  humidityPct: z.number().min(0).max(100),
  occupancyPct: z.number().min(0).max(100),
});

export const simulationSourceSchema = z.strictObject({
  id: z.string().min(1),
  /** Trazabilidad al catálogo, p. ej. "CatalogSpeaker:clx…". El motor no lo resuelve. */
  catalogRef: z.string().min(1),
  /** [x, y, z] en metros, mismo marco que RoomGeometry. */
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotationDeg: z.strictObject({
    yaw: z.number(),
    pitch: z.number(),
    roll: z.number(),
  }),
  levelDb: z.number(),
  polarityInverted: z.boolean(),
  delayMs: z.number().nonnegative(),
  /** Resuelto del grafo PA→parlante; con la sensibilidad da el SPL a 1 m. */
  electricalPowerW: z.number().positive(),
  spec: speakerSpecSchema,
  /**
   * Resuelto de las fuentes del grafo. Vocabulario cerrado desde la Fase 6: el motor lo declara
   * `str` y valida contra su tabla, así que estrechar aquí solo reduce lo que la app puede emitir
   * y no puede romper a un motor que ya aceptaba un superconjunto (ADR 0005, punto 2). Era la
   * deuda que `signal-flow/resolution/program-spectrum.ts` arrastraba desde la Fase 2.
   */
  programSpectrum: z.enum([
    "percussion",
    "strings",
    "keys",
    "vocals",
    "live_band",
    "flat_reference",
  ]),
});

/** La key llega descifrada solo aquí y solo si el usuario configuró una (ADR-08). */
export const simulationLlmConfigSchema = z.strictObject({
  provider: z.enum(["anthropic", "google", "deepseek"]),
  apiKey: z.string().min(1),
  enabled: z.boolean(),
});

export const simulationRequestSchema = z
  .strictObject({
    schemaVersion: z.literal("1"),
    jobId: z.string().min(1),
    simulationId: z.string().min(1),
    config: simulationConfigSchema,
    environment: simulationEnvironmentSchema,
    room: roomGeometrySchema,
    /** Catálogo resuelto: cada materialId citado por la geometría debe estar aquí. */
    materials: z.record(z.string(), materialSpecSchema),
    sources: z.array(simulationSourceSchema).min(1),
    llm: simulationLlmConfigSchema.optional(),
  })
  .meta({
    title: "SimulationRequest v1",
    description:
      "Payload autocontenido que aura-admin envía a POST /v1/simulations. Incluye geometría, " +
      "materiales y specs ya resueltos: el motor es una función pura sobre este documento.",
  });

export type SimulationConfig = z.infer<typeof simulationConfigSchema>;
export type SimulationEnvironment = z.infer<typeof simulationEnvironmentSchema>;
export type SimulationSource = z.infer<typeof simulationSourceSchema>;
export type SimulationRequest = z.infer<typeof simulationRequestSchema>;

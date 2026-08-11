// src/features/simulation/schemas/scene-simulation.ts — lo que el panel del editor 3D edita y
// Scene.simulation persiste: el ambiente y la configuración de cálculo, ANTES de simular.
//
// Reusa los schemas del contrato (simulationEnvironmentSchema, simulationConfigSchema) en vez de
// declarar los suyos: son exactamente los bloques que el payload lleva, y tenerlos por duplicado
// dejaría que la UI produjera algo que el motor rechaza. A diferencia de RoomDocument, aquí no hay
// nada que relajar — un ambiente a medio escribir sigue siendo un ambiente válido.

import { z } from "zod";
import { OCTAVE_BANDS_HZ } from "@/contracts/bands";
import {
  type SimulationConfig,
  type SimulationEnvironment,
  simulationConfigSchema,
  simulationEnvironmentSchema,
} from "@/contracts/simulation-request.schema";

/**
 * 20 °C y 50 % es la condición de referencia con la que están tabulados los coeficientes de
 * absorción, y es lo que usa CANON-01. Ocupación 0 porque una sala vacía es lo que el usuario
 * tiene delante mientras monta: suponerle público sería suponerle el peor caso sin avisar.
 */
export const DEFAULT_ENVIRONMENT: SimulationEnvironment = {
  temperatureC: 20,
  humidityPct: 50,
  occupancyPct: 0,
};

/**
 * Preset del modo simple (§5.3: "híbrido, grilla media"; §01: "el sistema elige el método").
 *
 * Los tres métodos, porque el factory del motor compone statistical (RT global) + direct_field
 * (mapa de SPL) + hybrid (claridad) — "híbrido" en §5.3 nombra el resultado, no un método único.
 * Suma en energía: §02 reserva la suma compleja al modo avanzado.
 *
 * Orden 3 y 20 000 rayos no son gusto: son el presupuesto que §6.2 fija para resolver una grilla de
 * hasta ~400 puntos en menos de 60 s. "Grilla media" se traduce a 1 m, la intermedia de las tres
 * que ofrece el modo avanzado (0.5/1/2). La semilla es fija para que el ray tracing sea reproducible
 * y los golden files valgan de algo.
 */
export const SIMPLE_CONFIG: SimulationConfig = {
  mode: "simple",
  methods: ["statistical", "hybrid", "direct_field"],
  bands: [...OCTAVE_BANDS_HZ],
  ism: { maxOrder: 3 },
  rayTracing: { nRays: 20_000, seed: 42 },
  grid: { resolutionM: 1, earHeightM: 1.2 },
  summation: "energy",
  // Sin objetivo de RT60 mientras nadie lo elija: null apaga RtTargetRule (ADR 0003), y suponerle
  // uno le daría al usuario recomendaciones de tratamiento contra un rango que nunca pidió.
  rtTargetS: null,
};

export const sceneSimulationSchema = z.strictObject({
  schemaVersion: z.literal("1").default("1"),
  environment: simulationEnvironmentSchema.default(DEFAULT_ENVIRONMENT),
  config: simulationConfigSchema.default(SIMPLE_CONFIG),
});

export type SceneSimulation = z.infer<typeof sceneSimulationSchema>;

/** Escena nunca configurada: la columna arranca en `{}` y todos los campos caen a su default. */
export const EMPTY_SCENE_SIMULATION: SceneSimulation =
  sceneSimulationSchema.parse({});

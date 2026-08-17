// src/features/simulation/__tests__/to-simulation-request.test.ts — el test que pide la Sección 11:
// "compilador de SimulationRequest (dado un grafo+room fixture → payload exacto)".
//
// La prueba de fuego es CANON-01: se reconstruye su sala y su fuente con las herramientas reales
// del editor y se compila, comprobando que sale el mismo payload que la fixture que comparten los
// dos repos. No se compara el JSON entero porque hay dos diferencias legítimas y documentadas —
// los muros salen renumerados wall_0..wall_3 (la fixture los nombra por punto cardinal) y el id de
// la fuente es el del nodo del grafo—, así que se comparan todos los campos que sí deben coincidir.

import { describe, expect, it } from "vitest";
import canonRequest from "@/contracts/fixtures/canon-01.request.json";
import { simulationRequestSchema } from "@/contracts/simulation-request.schema";
import {
  audienceZone,
  buildRoom,
  rectVertices,
} from "@/features/room-editor/__tests__/fixtures/room-builder";
import type { RoomDocument } from "@/features/room-editor/schemas/room-document";
import {
  CANON_MATERIAL_ID,
  canonSource,
  compileCanon,
} from "@/features/simulation/__tests__/fixtures/canon-scene";
import { toSimulationRequest } from "@/features/simulation/model/to-simulation-request";
import { sceneSimulationSchema } from "@/features/simulation/schemas/scene-simulation";

describe("CANON-01", () => {
  it("compila un payload que satisface el contrato v1", () => {
    expect(simulationRequestSchema.safeParse(compileCanon()).success).toBe(
      true,
    );
  });

  it("reproduce la sala de la fixture", () => {
    const { room } = compileCanon();

    expect(room.footprint.vertices).toEqual(
      canonRequest.room.footprint.vertices,
    );
    expect(room.height).toEqual(canonRequest.room.height);
    expect(room.zones.audience[0].earHeight).toBe(
      canonRequest.room.zones.audience[0].earHeight,
    );
    // Seis superficies (piso, techo y cuatro muros), todas con el material sintético de CANON-01.
    expect(room.surfaces).toHaveLength(6);
    expect(room.surfaces.every((s) => s.materialId === CANON_MATERIAL_ID)).toBe(
      true,
    );
  });

  it("reproduce ambiente y configuración tal cual", () => {
    const request = compileCanon();

    expect(request.environment).toEqual(canonRequest.environment);
    expect(request.config).toEqual(canonRequest.config);
    // ism y rayTracing están ausentes en la fixture porque `methods` no incluye hybrid: el
    // compilador transporta la config, no la completa.
    expect(request.config.ism).toBeUndefined();
    expect(request.config.rayTracing).toBeUndefined();
  });

  it("reproduce la fuente, con la posición que puso el editor 3D", () => {
    const [source] = compileCanon().sources;
    const expected = canonRequest.sources[0];

    expect(source.position).toEqual(expected.position);
    expect(source.rotationDeg).toEqual(expected.rotationDeg);
    expect(source.electricalPowerW).toBe(expected.electricalPowerW);
    expect(source.programSpectrum).toBe(expected.programSpectrum);
    expect(source.catalogRef).toBe(expected.catalogRef);
    expect(source.levelDb).toBe(expected.levelDb);
    expect(source.spec.sensitivity.dbSpl1w1m).toBe(96);
  });

  it("embebe el datasheet del material, no una referencia", () => {
    const { materials } = compileCanon();
    expect(materials[CANON_MATERIAL_ID].absorption["1000"]).toBe(0.1);
  });
});

describe("compilación general", () => {
  it("usa la colocación por defecto de una caja que nadie movió", () => {
    const vertices = rectVertices(20, 12);
    const document = buildRoom(
      { kind: "setFootprint", vertices },
      { kind: "setHeight", heightM: 6 },
      {
        kind: "insertAudienceZone",
        index: 0,
        zone: audienceZone("zone_1", vertices),
      },
    );

    const [source] = toSimulationRequest({
      jobId: "job_1",
      simulationId: "sim_1",
      document,
      simulation: sceneSimulationSchema.parse({}),
      sources: [canonSource],
      materials: {},
    }).sources;

    // Nunca queda sin posición: resolveSpeakerPlacements la calcula al vuelo (ver su cabecera).
    expect(source.position).toHaveLength(3);
    expect(source.position[2]).toBeGreaterThan(0);
  });

  it("empareja cada caja con SU colocación, no con la primera", () => {
    const vertices = rectVertices(20, 12);
    const base = buildRoom(
      { kind: "setFootprint", vertices },
      {
        kind: "insertAudienceZone",
        index: 0,
        zone: audienceZone("zone_1", vertices),
      },
    );
    const document: RoomDocument = {
      ...base,
      speakers: [
        {
          nodeId: "spk_b",
          position: [9, 9, 2],
          rotationDeg: { yaw: 10, pitch: 0, roll: 0 },
        },
        {
          nodeId: "spk_a",
          position: [1, 1, 1],
          rotationDeg: { yaw: 20, pitch: 0, roll: 0 },
        },
      ],
    };

    const { sources } = toSimulationRequest({
      jobId: "job_1",
      simulationId: "sim_1",
      document,
      simulation: sceneSimulationSchema.parse({}),
      sources: [
        { ...canonSource, nodeId: "spk_a" },
        { ...canonSource, nodeId: "spk_b" },
      ],
      materials: {},
    });

    expect(sources[0].id).toBe("spk_a");
    expect(sources[0].position).toEqual([1, 1, 1]);
    expect(sources[1].id).toBe("spk_b");
    expect(sources[1].position).toEqual([9, 9, 2]);
  });

  it("el preset simple es un payload válido y compone los tres métodos", () => {
    const simulation = sceneSimulationSchema.parse({});

    expect(simulation.config.mode).toBe("simple");
    expect(simulation.config.methods).toEqual([
      "statistical",
      "hybrid",
      "direct_field",
    ]);
    // Con hybrid en la lista, ism y rayTracing dejan de ser opcionales en la práctica: el motor
    // necesita el orden y los rayos para componerlo.
    expect(simulation.config.ism?.maxOrder).toBe(3);
    expect(simulation.config.rayTracing?.nRays).toBe(20_000);
    expect(simulation.config.summation).toBe("energy");
    expect(simulation.config.grid.resolutionM).toBe(1);
  });
});

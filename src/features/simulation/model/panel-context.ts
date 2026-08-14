// src/features/simulation/model/panel-context.ts — la sala como la ve quien decide dónde tratar.
//
// Sale de la RoomGeometry CONGELADA del `SimulationRequest`, no de la escena de hoy: los RT60 que
// justifican el tratamiento se midieron sobre esa sala, y proponer paneles sobre otra planta daría
// una posición que no corresponde a los números que la acompañan. Mismo criterio que
// treatable-surfaces.ts y resolve-treatment.ts.
//
// Los muros van NUMERADOS por índice de arista, que es la convención normativa del contrato, y con
// su material y su absorción a 1 kHz: un muro que ya es absorbente no es donde hay que colgar nada,
// y sin ese dato el modelo reparte paneles por la sala como si todas las paredes fueran iguales.
//
// Van también las CAJAS, que es lo que más cambia la respuesta: los paneles útiles están donde
// rebota el sonido directo —primeras reflexiones y muro del fondo—, no en el primer hueco libre.

import type { MaterialSpec, RoomGeometry, SimulationSource } from "@/contracts";
import {
  polygonAreaM2,
  polygonEdges,
} from "@/features/room-editor/model/polygon-2d";
import type { SimulationView } from "@/features/simulation/model/from-sim-results";

export type WallSummary = {
  /** Índice de arista: es lo que el modelo debe devolver como `wallIndex`. */
  wallIndex: number;
  lengthM: number;
  areaM2: number;
  material: string;
  /** Absorción a 1 kHz, que es donde se juzga si una superficie ya está tratada. */
  absorption1kHz: number | null;
  /** Los dos extremos, para que el modelo sepa qué muro está enfrente de qué. */
  fromM: [number, number];
  toM: [number, number];
};

export type PanelContext = {
  roomHeightM: number;
  floorAreaM2: number;
  walls: WallSummary[];
  /** Dónde está cada caja y hacia dónde apunta: 0° = mirando a +x. */
  speakers: { position: [number, number, number]; yawDeg: number }[];
  rt60ByBandS: Record<string, number>;
  rt60MidS: number | null;
  schroederHz: number | null;
  /** Lo que el motor ya mandó hacer sobre absorción: el consejo lo completa, no lo contradice. */
  deterministic: { rule: string; action: string; text: string }[];
};

export function buildPanelContext(input: {
  room: RoomGeometry;
  materials: Record<string, MaterialSpec>;
  sources: SimulationSource[];
  view: SimulationView;
}): PanelContext {
  const { room, materials, sources, view } = input;
  const vertices = room.footprint.vertices;
  const edges = polygonEdges(vertices);
  const wallSurfaces = room.surfaces.filter(
    (surface) => surface.type === "wall",
  );

  return {
    roomHeightM: room.height.h,
    floorAreaM2: Number(polygonAreaM2(vertices).toFixed(1)),
    walls: edges.map((edge, index) => {
      const surface = wallSurfaces[index];
      const spec = surface?.materialId
        ? materials[surface.materialId]
        : undefined;
      const lengthM = Math.hypot(
        edge.to[0] - edge.from[0],
        edge.to[1] - edge.from[1],
      );

      return {
        wallIndex: index,
        lengthM: Number(lengthM.toFixed(2)),
        areaM2: Number((lengthM * room.height.h).toFixed(1)),
        material: spec?.name ?? "sin asignar",
        absorption1kHz: spec?.absorption["1000"] ?? null,
        fromM: [edge.from[0], edge.from[1]],
        toM: [edge.to[0], edge.to[1]],
      };
    }),
    speakers: sources.map((source) => ({
      position: source.position.map((value) => Number(value.toFixed(2))) as [
        number,
        number,
        number,
      ],
      yawDeg: Number(source.rotationDeg.yaw.toFixed(1)),
    })),
    rt60ByBandS: round(view.bands.rt60),
    rt60MidS: midBand(view.bands.rt60),
    schroederHz: view.scalars.schroederHz ?? null,
    deterministic: view.recommendations
      .filter(
        (item) =>
          item.action.type.includes("absorption") ||
          item.action.type === "treat_reflections",
      )
      .map((item) => ({
        rule: item.rule,
        action: item.action.type,
        text: item.text,
      })),
  };
}

/** RT60 medio = media de 500 y 1000 Hz, que es como se cita el tiempo de reverberación. */
function midBand(rt60: Record<string, number> | undefined): number | null {
  const mid = [rt60?.["500"], rt60?.["1000"]].filter(
    (value): value is number => typeof value === "number",
  );
  if (mid.length === 0) return null;

  const mean = mid.reduce((total, value) => total + value, 0) / mid.length;
  return Number(mean.toFixed(2));
}

function round(
  byBand: Record<string, number> | undefined,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(byBand ?? {}).map(([band, value]) => [
      band,
      Number(value.toFixed(2)),
    ]),
  );
}

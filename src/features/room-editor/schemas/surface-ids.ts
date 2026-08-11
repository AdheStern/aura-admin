// src/features/room-editor/schemas/surface-ids.ts — identidad de las superficies del recinto.
//
// Dos identidades conviven a propósito: dentro del documento el id de un muro es ESTABLE (las
// aberturas lo referencian y tienen que sobrevivir a que se inserte un vértice en otra arista),
// mientras que en el contrato RoomGeometry lo que fija la correspondencia con el footprint es el
// ORDEN dentro de `surfaces`. El compilador renumera al salir; aquí solo se generan ids únicos.

const WALL_ID_PREFIX = "wall_";

export const FLOOR_SURFACE_ID = "floor";
export const CEILING_SURFACE_ID = "ceiling";

export function wallSurfaceId(index: number): string {
  return `${WALL_ID_PREFIX}${index}`;
}

/**
 * Id nuevo por el máximo en uso + 1, no por la longitud de la lista: insertar un vértice en medio
 * no puede reutilizar el id de un muro vivo. Determinista a propósito — un id aleatorio aquí
 * rompería el rehacer, porque reejecutar el comando generaría otro id que las aberturas ya no
 * referenciarían.
 */
export function nextWallId(surfaces: readonly { id: string }[]): string {
  const used = surfaces
    .map((surface) => wallIdIndex(surface.id))
    .filter((index): index is number => index !== null);

  return wallSurfaceId(used.length === 0 ? 0 : Math.max(...used) + 1);
}

function wallIdIndex(id: string): number | null {
  if (!id.startsWith(WALL_ID_PREFIX)) return null;
  const index = Number(id.slice(WALL_ID_PREFIX.length));
  return Number.isInteger(index) && index >= 0 ? index : null;
}

// src/lib/db.ts — cliente Prisma sobre el pool de `pg`.
//
// El pool NO se deja en sus valores por defecto, y no es afinado prematuro: el pooler de Supabase
// cierra las conexiones que llevan un rato quietas, y esta app las tiene quietas a menudo — una
// simulación con el método híbrido tarda minutos, y en ese hueco no se consulta nada. Con los
// defaults, la siguiente consulta agarra un socket que el servidor ya cerró y revienta con
// "Connection terminated unexpectedly" en vez de reconectar. Apareció al correr el camino dorado
// contra el motor real: la simulación terminó bien y la página de resultados devolvió 500.
//
// `idleTimeoutMillis` por debajo del corte del pooler es lo que lo arregla: el cliente suelta la
// conexión antes de que el servidor la tire, así que nunca hay un socket muerto en el pool.
// `keepAlive` mantiene viva la que sí está en uso frente a cortes de NAT en conexiones largas.

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  var cachedPrisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  // Cómodamente por debajo del minuto largo que aguanta el pooler antes de cerrar por su cuenta.
  idleTimeoutMillis: 20_000,
  keepAlive: true,
});

export const db = globalThis.cachedPrisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.cachedPrisma = db;
}

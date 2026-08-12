// vitest.integration.config.ts — la capa de integración de la Sección 11, contra Postgres de
// verdad. Aparte de vitest.config.ts a propósito: `pnpm test` tiene que seguir siendo puro y correr
// en segundos, sin depender de que haya una base levantada.

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/__tests__/integration/**/*.test.ts"],
    // Apunta Prisma a TEST_DATABASE_URL antes de que se importe el singleton de src/lib/db.ts.
    setupFiles: ["src/test/integration-setup.ts"],
    // Comparten base: en paralelo, el `cleanUp` de un archivo borraría las filas de otro.
    fileParallelism: false,
  },
});

import { defaultExclude, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    // e2e/ usa el test runner de Playwright (test/expect propios) — sin este exclude, el patrón
    // por defecto de Vitest también lo recoge y falla porque no es un test de Vitest.
    exclude: [...defaultExclude, "e2e/**"],
  },
});

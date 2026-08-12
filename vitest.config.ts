import { defaultExclude, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    // e2e/ usa el test runner de Playwright (test/expect propios) — sin este exclude, el patrón
    // por defecto de Vitest también lo recoge y falla porque no es un test de Vitest.
    //
    // integration/ necesita una Postgres levantada y tiene su propia config: aquí dentro haría que
    // `pnpm test` dejara de correr sin base, que es justo lo que esta separación evita.
    exclude: [...defaultExclude, "e2e/**", "src/**/__tests__/integration/**"],
  },
});

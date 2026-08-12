// playwright.config.ts — configuración del E2E dorado (Sección 11 del doc maestro: "Corre en CI en
// cada PR"). Un solo navegador y un solo spec por ahora — alcanza para el camino mínimo de la Fase
// 2 (flujo de señal); se amplía cuando la Fase 3+ agregue recinto, 3D y resultados al camino real.

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // Cada test registra su propio usuario contra la BD real: correrlos en paralelo entre sí
  // multiplicaría cuentas de prueba sin necesidad — no hay nada que ganar paralelizando todavía.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  // "github" para las anotaciones inline en el PR; "html" es lo que sube el paso "Upload
  // Playwright report" de ci.yml cuando algo falla — con solo "github" no queda ningún artefacto
  // que descargar para ver la traza de un fallo.
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  // Next dev (Turbopack) compila cada ruta la primera vez que se visita — se ha visto hasta ~20 s
  // en la primera carga de una ruta pesada. El default de 30 s de Playwright confunde eso con un
  // test colgado.
  //
  // El camino dorado recorre ocho pantallas, espera dos autosaves con debounce y una simulación
  // entera: con 120 s iba justo al límite y fallaba por lo más lento de cada corrida, que no era
  // siempre lo mismo. Un techo holgado no esconde nada —un cuelgue de verdad no acaba nunca— y sí
  // evita un test que se cae por el compilado en frío de una ruta.
  timeout: 240_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // CI: sirve el build de producción que el paso "Build" de ci.yml ya generó — evita que cada
    // ruta compile en frío bajo Turbopack dev y hace el E2E más rápido y más parecido a lo real.
    // Local: `pnpm dev`, para poder reusar un servidor que ya esté corriendo mientras iterás.
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // `mock` a secas devuelve CANON-01, que no trae grillas ni recomendaciones: con él la mitad de
    // la pantalla de resultados no existe y no habría nada que asertar. TRAMPA local: si ya tenías
    // un `pnpm dev` levantado, Playwright lo reusa con el modo que tuviera, y los pasos de
    // resultados fallan sin decir por qué — bájalo antes de correr el E2E.
    // mock-full por defecto: CI no levanta el motor y el loopback recorre la misma ingesta. Pero
    // se respeta un ENGINE_MODE del entorno para poder correr el mismo camino contra el motor de
    // verdad —`ENGINE_MODE=http pnpm test:e2e`—, que es la única prueba de que la firma HMAC, el
    // callback y el contrato cuadran entre los dos repos.
    env: { ENGINE_MODE: process.env.ENGINE_MODE ?? "mock-full" },
  },
});

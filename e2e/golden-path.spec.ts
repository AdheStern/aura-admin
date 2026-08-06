// e2e/golden-path.spec.ts — el camino dorado de la Sección 11 del doc maestro, en la parte que ya
// existe (Fase 2, flujo de señal): registro → proyecto → escena → fuente→consola→PA→2 parlantes→
// simulación → "Flujo listo". Se amplía cuando la Fase 3+ agregue recinto, 3D y resultados.
//
// Las marcas/modelos de abajo vienen de prisma/seed/*.ts (sources.ts, consoles.ts, amplifiers.ts,
// speakers.ts) — son curaduría real, no fixtures de test. Si el seed cambia esos nombres, este
// spec hay que actualizarlo junto con él; por eso están centralizados aquí y no repetidos abajo.

import { expect, type Locator, type Page, test } from "@playwright/test";

const SOURCE_NAME = "Voz masculina";
const CONSOLE_MODEL = "Midas M AIR MR18";
const AMPLIFIER_MODEL = "Crown XLS 1502";
const SPEAKER_MODEL = "JBL PRX418S"; // pasiva (activePowered:false) — necesita el amplificador

test("fuente → consola → PA → 2 parlantes → simulación deja la escena en Flujo listo", async ({
  page,
}) => {
  const stamp = Date.now();

  await test.step("registro", async () => {
    await page.goto("/register");
    await page.fill("#name", "E2E Golden Path");
    await page.fill("#email", `e2e-golden-${stamp}@example.com`);
    await page.fill("#password", "GoldenPath123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/projects");
  });

  await test.step("crear proyecto y escena", async () => {
    await page.click('button:has-text("+ Nuevo proyecto")');
    await page.fill('input[name="name"]', `E2E ${stamp}`);
    await page.click('button:has-text("Crear proyecto")');
    await page.waitForSelector('input[name="name"]', { state: "detached" });
    await page.click("text=Abrir");
    await page.waitForURL("**/projects/*");

    await page.click('button:has-text("+ Nueva escena")');
    await page.fill('input[name="name"]', "Camino dorado");
    await page.click('button:has-text("Crear escena")');
    await page.waitForSelector('input[name="name"]', { state: "detached" });

    const sceneLink = page.getByRole("link", {
      name: "Camino dorado",
      exact: true,
    });
    await sceneLink.waitFor({ timeout: 30_000 });
    await sceneLink.click();
    await page.waitForURL("**/flow", { timeout: 30_000 });
    await page.waitForSelector("text=Estado del sistema");
  });

  await test.step("armar el sistema", async () => {
    await addNode(page, "Fuente");
    await addNode(page, "Consola");
    await addNode(page, "Amplificador / PA");
    await addNode(page, "Parlante");
    await addNode(page, "Parlante");

    await pickCatalogItem(page, 0, SOURCE_NAME);
    await pickCatalogItem(page, 1, CONSOLE_MODEL);
    await pickCatalogItem(page, 2, AMPLIFIER_MODEL);
    await pickCatalogItem(page, 3, SPEAKER_MODEL);
    await pickCatalogItem(page, 4, SPEAKER_MODEL);

    // El layout en grilla del toolbar deja los seis nodos separados pero no siempre dentro del
    // viewport inicial; fitView es más confiable que calcular coordenadas de pantalla a mano.
    await page.click(".react-flow__controls-fitview");
    await page.waitForTimeout(300);

    const simulation = await nodeIdAt(page, 0);
    const source = await nodeIdAt(page, 1);
    const consoleNode = await nodeIdAt(page, 2);
    const amplifier = await nodeIdAt(page, 3);
    const speaker1 = await nodeIdAt(page, 4);
    const speaker2 = await nodeIdAt(page, 5);

    // source→consola por línea/DI (el camino dorado del doc salta el micrófono a propósito).
    await connect(
      page,
      handle(page, source, "di"),
      handle(page, consoleNode, "in-0"),
    );
    await connect(
      page,
      handle(page, consoleNode, "out-0"),
      handle(page, amplifier, "in-0"),
    );
    // Un canal de potencia por caja: evita la complicación de la carga en paralelo en este camino.
    await connect(
      page,
      handle(page, amplifier, "out-0"),
      handle(page, speaker1, "in"),
    );
    await connect(
      page,
      handle(page, amplifier, "out-1"),
      handle(page, speaker2, "in"),
    );
    await connect(
      page,
      handle(page, speaker1, "sim"),
      handle(page, simulation, "in"),
    );
    await connect(
      page,
      handle(page, speaker2, "sim"),
      handle(page, simulation, "in"),
    );

    await expect(page.locator(".react-flow__edge")).toHaveCount(6);
  });

  await test.step("el panel muestra la resolución eléctrica de la caja", async () => {
    // Por clase de tipo y no por texto: filtrar por "Parlante" también matchea el nodo simulación,
    // cuyo puerto de entrada se llama "Parlantes". Y el click va sobre la franja del título porque
    // en el centro está el <Select> de equipo, que abriría su desplegable en vez de seleccionar.
    await page
      .locator(".react-flow__node-speaker")
      .first()
      .click({ position: { x: 20, y: 10 } });

    await expect(page.getByText("Resolución eléctrica")).toBeVisible();
    // Crown XLS 1502 declara 300 W a 8 Ω y aquí cada caja tiene su propio canal, así que se lleva
    // los 300 W enteros: si el reparto se aplicara mal, esta cifra sería la primera en delatarlo.
    await expect(page.getByText("300 W", { exact: true })).toBeVisible();
    // "Voz masculina" es la única fuente del sistema → familia vocals, no la mezcla live_band.
    await expect(page.getByText("Voces", { exact: true })).toBeVisible();
  });

  await test.step("autosave persiste el veredicto autoritativo", async () => {
    // Debounce de 1.5 s (Sección 5.1) + ida y vuelta al servidor antes de que el badge refleje el
    // status autoritativo — ver applySaveResult en flow-store.ts.
    await expect(page.getByText("Flujo listo")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Guardado")).toBeVisible({ timeout: 5_000 });

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText("Flujo listo")).toBeVisible();
    await expect(page.locator(".react-flow__edge")).toHaveCount(6);
  });
});

async function addNode(page: Page, label: string): Promise<void> {
  await page.locator(`button:has-text("${label}")`).first().click();
}

async function pickCatalogItem(
  page: Page,
  triggerIndex: number,
  optionText: string,
): Promise<void> {
  await page.locator('[data-slot="select-trigger"]').nth(triggerIndex).click();
  await page
    .locator('[role="option"]:visible', { hasText: optionText })
    .first()
    .click();
  await page.waitForTimeout(150);
}

/** El orden de montaje en el DOM sigue el orden de inserción: 0 es la simulación de la escena
 *  vacía, 1..5 son los que agrega addNode en el orden en que se llamó. */
async function nodeIdAt(page: Page, index: number): Promise<string> {
  const id = await page
    .locator(".react-flow__node")
    .nth(index)
    .getAttribute("data-id");
  if (!id) throw new Error(`Nodo ${index} no tiene data-id`);
  return id;
}

function handle(page: Page, nodeId: string, portId: string): Locator {
  return page.locator(`[data-nodeid="${nodeId}"][data-handleid="${portId}"]`);
}

/** Arrastre real de puntero: React Flow escucha pointerdown/move/up, no drag-and-drop HTML5. */
async function connect(
  page: Page,
  source: Locator,
  target: Locator,
): Promise<void> {
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to)
    throw new Error("Handle sin bounding box: ¿está fuera de la vista?");

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
}

// e2e/golden-path.spec.ts — el camino dorado COMPLETO de la Sección 11 del doc maestro: registro →
// proyecto → escena → fuente→consola→PA→2 parlantes→simulación ("Flujo listo") → recinto con zona
// de audiencia ("Recinto listo") → materiales → editor 3D → objetivo de RT60 → simular → resultados
// → banner de desactualizado → cancelar.
//
// Un solo test y no cinco: montar la escena cuesta minuto y medio, y cada spec nuevo la montaría
// otra vez para probar un paso más. Los `test.step` dan el mismo detalle al fallar.
//
// Corre con ENGINE_MODE=mock-full (ver playwright.config.ts). No es un atajo: el loopback firma y
// POSTea a las mismas rutas /api/internal que usa el motor real, así que esto ejercita la firma
// HMAC, la ingesta y las transiciones de estado igual que un despliegue.
//
// Las marcas/modelos de abajo vienen de prisma/seed/*.ts (sources.ts, consoles.ts, amplifiers.ts,
// speakers.ts) — son curaduría real, no fixtures de test. Si el seed cambia esos nombres, este
// spec hay que actualizarlo junto con él; por eso están centralizados aquí y no repetidos abajo.

import { expect, type Locator, type Page, test } from "@playwright/test";

const SOURCE_NAME = "Voz masculina";
const CONSOLE_MODEL = "Midas M AIR MR18";
const AMPLIFIER_MODEL = "Crown XLS 1502";
const SPEAKER_MODEL = "JBL PRX418S"; // pasiva (activePowered:false) — necesita el amplificador
const MATERIAL_NAME = "Ladrillo visto pintado";

// Contra el motor REAL esto es una simulación de verdad, no un loopback: el preset simple lleva
// híbrido, y medido sobre esta misma sala —57 m², ladrillo por todas partes— tarda del orden de
// minutos. El coste no lo manda la grilla (14 puntos) sino lo viva que es la sala: el trazado de
// rayos calcula hasta que la energía decae, y con α ≈ 0.02 eso es una cola larguísima.
//
// El techo se queda por debajo del corte de 10 minutos de la Sección 08: si la simulación tarda
// más que eso, el cron la mata y el test debe fallar, no esperar más.
const RESULT_TIMEOUT_MS = process.env.ENGINE_MODE === "http" ? 540_000 : 30_000;
// Ir del editor 3D a resultados no es una navegación cualquiera: al terminar el job,
// use-job-progress pide un router.refresh() de esa ruta —la más pesada de la app, con el lienzo
// WebGL montado— y este clic espera a que aquello se asiente. Con 30 s la corrida en mock salía
// intermitente, que es la peor clase de test: pasa al reintentar y nadie mira por qué.
// El margen no esconde un cuelgue —un cuelgue no termina nunca— sino que reconoce una transición
// que es lenta de verdad. Contra el motor real hace falta más porque el refresco llega después de
// minutos de espera, con la pestaña ya cargada de estado.
const NAVIGATION_TIMEOUT_MS =
  process.env.ENGINE_MODE === "http" ? 120_000 : 60_000;

test("fuente → consola → PA → 2 parlantes → simulación → recinto deja la escena en Recinto listo", async ({
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

  await test.step("pasar al editor 2D y dibujar el recinto", async () => {
    // El botón solo se habilita en FLOW_READY (Sección 08); en DRAFT no existiría este link.
    await page.click('a:has-text("Editor 2D")');
    await page.waitForURL("**/room", { timeout: 30_000 });
    await page.waitForSelector("text=Recinto");

    const canvas = page.locator("canvas").first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Lienzo del recinto sin bounding box");

    // Fracciones del lienzo, no píxeles fijos: el tamaño real depende del viewport del navegador.
    await pickTool(page, "Planta", "Rectángulo");
    await dragOnCanvas(page, box, { x: 0.15, y: 0.15 }, { x: 0.65, y: 0.65 });

    await pickTool(page, "Zona", "Zona de audiencia");
    await dragOnCanvas(page, box, { x: 0.25, y: 0.25 }, { x: 0.5, y: 0.5 });
  });

  await test.step("autosave del recinto persiste el veredicto autoritativo", async () => {
    // No hace falta material asignado para completar el recinto (MATERIAL_NOT_ASSIGNED es aviso,
    // no error — Sección 4.2 del doc maestro): un footprint simple + una zona de audiencia bastan.
    await expect(page.getByText("Recinto listo")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Guardado")).toBeVisible({ timeout: 5_000 });

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText("Recinto listo")).toBeVisible();
  });

  await test.step("asignar material a las seis superficies", async () => {
    // ROOM_READY no basta para SIMULAR: se llega ahí con superficies sin material —
    // MATERIAL_NOT_ASSIGNED es aviso, no error— y el contrato exige `materialId` en todas
    // (ver can-simulate.ts). Sin este paso el botón "Simular" se queda deshabilitado.
    await page.click('button[aria-label="Seleccionar / mover"]');

    // Los tres campos del panel de la sala: piso, techo y —de una vez— todos los muros.
    await pickMaterial(page, 0, MATERIAL_NAME);
    await pickMaterial(page, 1, MATERIAL_NAME);
    await pickMaterial(page, 2, MATERIAL_NAME);

    // El validador es quien lleva la cuenta de verdad: si alguna superficie se hubiera quedado sin
    // material, aquí seguiría diciéndolo y el botón "Simular" saldría deshabilitado más adelante.
    await expect(page.getByText(/superficies? sin material/)).toBeHidden();
    await expect(page.getByText("Guardado")).toBeVisible({ timeout: 10_000 });
  });

  await test.step("generar el editor 3D desde el recinto listo", async () => {
    // El botón solo se habilita en ROOM_READY (Sección 08): "Recinto listo" ya lo deja disponible.
    await page.click('a:has-text("Generar 3D")');
    await page.waitForURL("**/room/3d", { timeout: 30_000 });
    await page.waitForSelector('a:has-text("Editor 2D")');

    // El picking de superficies (raycaster de R3F sobre un <canvas> WebGL) no tiene DOM que
    // consultar desde Playwright; esa cobertura queda en mesh-selection.test.ts (unitario). Aquí
    // solo se confirma que la escena 3D se monta sin romper el camino dorado.
    await expect(page.locator("canvas")).toBeVisible({ timeout: 10_000 });
  });

  await test.step("elegir objetivo de RT60 y simular", async () => {
    // Sin objetivo el contrato manda `null` y RtTargetRule no evalúa nada (ADR 0003): elegirlo es
    // lo que hace aparecer la recomendación de tratamiento más abajo.
    await pickRtTarget(page, "Auditorio mixto");

    // El boton se llama "Guardando cambios..." y esta deshabilitado hasta que aterriza el autosave:
    // el payload se compila desde lo GUARDADO, asi que simular antes mandaria la configuracion
    // anterior. Esperar a que vuelva a decir "Simular" es esperar exactamente a eso.
    const simulate = page.getByRole("button", { name: "Simular", exact: true });
    await expect(simulate).toBeEnabled({ timeout: 15_000 });
    await simulate.click();
    // El loopback entrega seis latidos de 500 ms antes del resultado, así que da tiempo a verlo.
    await expect(page.getByText("Cancelar")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Simulación completada")).toBeVisible({
      timeout: RESULT_TIMEOUT_MS,
    });
  });

  await test.step("los resultados enseñan las cinco secciones", async () => {
    await page.click('a:has-text("Ver resultados")');
    // Por el encabezado y no por waitForURL: la página de resultados monta gráficos que dejan
    // peticiones abiertas, así que el evento `load` que espera waitForURL puede no llegar nunca
    // aunque el contenido ya esté delante.
    //
    // El margen extra contra el motor real no es por la página —cargada sola tarda 3.7 s— sino por
    // lo que la precede: al terminar el job, use-job-progress pide un router.refresh() del editor
    // 3D, que es la ruta más pesada de la app, y esta navegación espera a que aquello se asiente.
    await expect(
      page.getByRole("heading", { name: /^Resultados ·/ }),
    ).toBeVisible({ timeout: NAVIGATION_TIMEOUT_MS });

    // El veredicto es lo primero que se lee, y es lo unico que responde a "esta bien la sala".
    await expect(page.getByText(/^La sala /)).toBeVisible();
    await expect(page.getByText("Nivel medio")).toBeVisible();
    await expect(page.getByText("RT60 (Sabine)")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Nivel en la audiencia" }),
    ).toBeVisible();
    await expect(page.getByText(/Reparto del nivel/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Alertas" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Detalle por banda" }),
    ).toBeVisible();
  });

  await test.step("las recomendaciones llegan con su acción", async () => {
    await expect(
      page.getByRole("heading", { name: "Recomendaciones" }),
    ).toBeVisible();

    // Con el motor REAL no se puede exigir una recomendación concreta: cuáles disparan depende de
    // la sala. En la del camino dorado la cobertura sale uniforme de verdad —σ = 1.5 dB, por debajo
    // del umbral de 3— así que CoverageGapRule NO emite nada, y exigir "Reorientar caja" seria
    // pedirle al motor que se equivoque. Se comprueba que llegó ALGO con su etiqueta traducida.
    if (process.env.ENGINE_MODE === "http") {
      // Por el texto de la insignia de prioridad, que toda tarjeta lleva sea cual sea su regla.
      await expect(page.getByText(/^Prioridad \d/).first()).toBeVisible();
      return;
    }

    // Las dos que emite mock-full: la de cobertura trae botón porque la app sabe ejecutarla, y la
    // de absorción no, porque describe obra fuera de la app.
    await expect(page.getByText("Reorientar caja")).toBeVisible();
    await expect(page.getByText("Añadir absorción")).toBeVisible();
    await expect(page.getByText("Aplicar al 3D")).toBeVisible();
  });

  await test.step("cambiar la escena marca los resultados como viejos", async () => {
    const resultsUrl = page.url();

    await page.goBack();
    await page.waitForURL("**/room/3d", { timeout: 30_000 });
    // Cambiar el objetivo cambia `config`, y con él el hash del request: es exactamente lo que
    // is-simulation-outdated compara.
    await pickRtTarget(page, "Palabra");
    // Mismo criterio que arriba: el boton vuelve a decir "Simular" cuando el cambio ya esta en la
    // base, que es justo lo que cambia el hash con el que se compara la escena.
    await expect(
      page.getByRole("button", { name: "Simular", exact: true }),
    ).toBeEnabled({ timeout: 15_000 });

    await page.goto(resultsUrl);
    await expect(
      page.getByText(/La escena cambió desde que se calculó/),
    ).toBeVisible();
  });

  await test.step("una simulación se puede cancelar a mitad", async () => {
    await page.goBack();
    await page.waitForURL("**/room/3d", { timeout: 30_000 });

    await page.click('button:has-text("Simular")');
    await page.click('button:has-text("Cancelar")');

    // El motor no manda callback al cancelar (§08): es la app quien escribe el estado final, así
    // que si esto se quedara colgado sería que nadie lo escribió.
    await expect(page.getByText("Simulación cancelada")).toBeVisible({
      timeout: 30_000,
    });
  });
});

/** El picker de material es un Combobox con filtro por texto, no un Select: hay que teclear para
 *  que la opción aparezca en la lista. `index` distingue piso (0) de techo (1) en el panel de la
 *  sala; en el panel de un muro solo hay uno. */
async function pickMaterial(
  page: Page,
  index: number,
  name: string,
): Promise<void> {
  const input = page.getByPlaceholder("Buscar material…").nth(index);
  await input.click();
  await input.fill(name);
  await page
    .locator('[role="option"]:visible', { hasText: name })
    .first()
    .click();
}

/** El objetivo de RT60 vive en un Select cuyo texto es "Etiqueta · rango", así que se busca por
 *  el nombre del preset y no por la cadena entera. */
async function pickRtTarget(page: Page, label: string): Promise<void> {
  await page.locator("#rt-target").click();
  await page
    .locator('[role="option"]:visible', { hasText: label })
    .first()
    .click();
}

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

/** Elige una herramienta de la tira lateral. Las familias con más de una variante (Planta, Pilar,
 *  Abertura, Zona) solo enseñan una en la tira y esconden el resto tras el flyout del triangulito
 *  —ver tool-slot.tsx—, así que hay que abrirlo aunque la que se quiere sea la visible. */
async function pickTool(
  page: Page,
  groupLabel: string,
  toolLabel: string,
): Promise<void> {
  await page.click(`button[aria-label="Variantes de ${groupLabel}"]`);
  await page
    .locator('[role="menuitem"]:visible', { hasText: toolLabel })
    .first()
    .click();
}

/** Arrastre de esquina a esquina sobre el lienzo Konva del recinto, en fracciones del bounding box
 *  (0–1): el rect-tool y el zone-tool leen del <canvas>, que no tiene handles de React Flow que
 *  clicar — solo mousedown/move/up crudos sobre coordenadas de pantalla. */
async function dragOnCanvas(
  page: Page,
  box: { x: number; y: number; width: number; height: number },
  startFrac: { x: number; y: number },
  endFrac: { x: number; y: number },
): Promise<void> {
  const start = {
    x: box.x + box.width * startFrac.x,
    y: box.y + box.height * startFrac.y,
  };
  const end = {
    x: box.x + box.width * endFrac.x,
    y: box.y + box.height * endFrac.y,
  };

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move((start.x + end.x) / 2, (start.y + end.y) / 2, {
    steps: 5,
  });
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up();
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

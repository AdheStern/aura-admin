// src/lib/performance-budget.ts — los techos de tiempo y tamaño que esta app se compromete a
// cumplir, en un solo sitio.
//
// Un número suelto dentro de un fetch no se audita: nadie sabe si es una decisión o el primer
// valor que alguien tecleó. Declarados aquí, con el porqué al lado, se pueden medir y discutir.
//
// El presupuesto del MOTOR es otro y vive en su repo (Sección 6.2: grilla de ~400 puntos con
// orden ISM 3 y 20k rayos en < 60 s). Aquí solo está lo que corre en esta app.

/**
 * Encolar es un `202`: el motor valida el payload y responde SIN calcular nada. Por eso el techo
 * puede ser corto, y por eso separa "motor caído" de "motor lento" — lo lento no cabe aquí.
 *
 * Queda por debajo de los 10 s que dura una función serverless típica, con margen para el INSERT
 * que va antes y el UPDATE que va después. Con un techo mayor, lo que cortaría sería la
 * plataforma: el job se quedaría en QUEUED para siempre y sin un mensaje que explique nada.
 */
export const ENGINE_SUBMIT_TIMEOUT_MS = 8_000;

/**
 * Cancelar solo consulta el store en memoria del motor y marca un flag. Si no contesta en este
 * tiempo, la app NO puede suponer que paró: se trata como inalcanzable, que es la lectura
 * conservadora — decir "cancelado" de algo que sigue calculando es peor que no saberlo.
 */
export const ENGINE_CANCEL_TIMEOUT_MS = 5_000;

/**
 * Compilar `SimulationRequest` desde la escena, sin contar las lecturas de BD que van antes.
 *
 * Solo la parte pura: lo que tarde Postgres en devolver el catálogo no es un presupuesto de este
 * código, y meterlo aquí convertiría el test en un medidor de la latencia de la red.
 *
 * CANON-01 mide 0.016 ms en esta máquina. El techo deja ~300× de margen porque un runner de CI es
 * más lento y va compartido; lo que vigila no son décimas, es que nadie meta un bucle cuadrático.
 */
export const COMPILE_REQUEST_BUDGET_MS = 5;

/**
 * El payload viaja firmado, se guarda entero en `Simulation.request` y se rehashea para saber si
 * unos resultados están desactualizados. Que engorde no rompe nada de golpe: encarece las tres
 * cosas a la vez y en silencio.
 *
 * LIMITACIÓN: CANON-01 mide 2.1 KB —una fuente y seis superficies—, así que este techo no es un
 * presupuesto ajustado sino un tope contra lo grosero: que alguien embeba un RIR, una imagen o el
 * catálogo entero dentro del request. Una escena real con veinte cajas sigue estando muy por
 * debajo.
 */
export const REQUEST_SIZE_BUDGET_BYTES = 1_000_000;

/**
 * Rasterizar la grilla de SPL para pintarla sobre el 3D. `SPL_RASTER_BUDGET_POINTS` es el techo de
 * la Sección 6.2 —lo más grande que el motor puede devolver—, así que es el peor caso real.
 *
 * Corre en el navegador y en el hilo principal: pasarse de aquí no da un número feo en un log, da
 * un tirón visible al abrir los resultados. Los 400 puntos miden 0.567 ms en esta máquina.
 */
export const SPL_RASTER_BUDGET_POINTS = 400;
export const SPL_RASTER_BUDGET_MS = 20;

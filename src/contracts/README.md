# Contratos v1

Copia espejo de `aura-engine/contracts/`. Fuente de verdad del doc maestro: Secciones 4.2 y 07.

## Qué es fuente y qué es artefacto

- **`*.schema.ts`** — los contratos escritos en zod. **Aquí se edita.**
- **`*.schema.json`** — JSON Schema (draft 2020-12) generado desde los zod con
  `pnpm contracts:build`. **No se edita a mano.** Es el artefacto que se copia tal cual a
  `aura-engine/contracts/`, donde Pydantic lo consume.

`registry.ts` enumera los contratos y su archivo; el test de `__tests__/json-schemas.test.ts`
falla si un `.json` se desincroniza de su zod en cualquiera de las dos direcciones, y si
CANON-01 deja de validar. Los schemas se generan autocontenidos (sin `$ref`/`$defs`) para que
cada archivo se pueda copiar y consumir suelto.

## Cambiar un contrato (Sección 07, obligatorio)

1. Editar el `.schema.ts` e incrementar `schemaVersion` si el cambio rompe compatibilidad.
2. `pnpm contracts:build` y `pnpm test`.
3. Dos PRs enlazados (uno por repo) con el schema y las fixtures golden idénticos.
4. Desplegar **primero el motor** (acepta versión vieja y nueva), después la app.

Red de seguridad: el motor responde `UNSUPPORTED_SCHEMA_VERSION` ante cualquier versión que
no conozca, y el CI de cada repo valida sus fixtures contra su copia local.

## Estricto vs. laxo, y por qué

| Contrato | Campos desconocidos | Razón |
|---|---|---|
| `SpeakerSpec`, `MaterialSpec`, `MicrophoneSpec`, `ConsoleSpec`, `AmplifierSpec` | se aceptan | Regla (3) de ingesta de catálogos: un datasheet más rico que el schema no se rechaza. |
| `RoomGeometry`, `SimulationRequest` | se rechazan | Un campo de más es un bug del compilador de escenas; mejor `INVALID_PAYLOAD` que una simulación entera mal calculada. |
| `SimulationResult`, `EngineError` | se aceptan | El despliegue va motor primero: durante esa ventana la app recibe resultados de un motor más nuevo y no debe romperse al leerlos. |

> **Trampa:** `z.object()` no sirve para "estricto". Zod *silencia* los campos desconocidos
> (los descarta sin error) y por eso el JSON Schema generado no lleva
> `additionalProperties: false`. Usa `z.strictObject()` para rechazar y `z.looseObject()` para
> conservar. Los casos del bloque "Estricto vs. laxo" del test fijan esta decisión por contrato.

## Decisiones tomadas aquí (no estaban cerradas en el doc)

- **`MicrophoneSpec`, `ConsoleSpec` y `AmplifierSpec` se definieron enteros aquí.** El doc maestro
  solo los nombra como tablas (`// catalog_microphone, catalog_console, catalog_amplifier: misma
  forma`, Sección 4.1) y describe en prosa qué aporta cada nodo al flujo (Sección 5.1); no da ni un
  campo. No estaban agendados en Fase 0 ni listados como decisión abierta en la Sección 14, pero
  Fase 1 pide seed de 10 micrófonos, 5 consolas y 5 PA. Los tres se añadieron a la Sección 4.2 del
  doc al cerrarlos.
- **Sin espejo en `aura-engine/contracts/` todavía.** El `SimulationRequest` solo transporta
  parlantes: del grafo mic→consola→PA sobreviven dos escalares derivados (`electricalPowerW` y
  `programSpectrum`). Estos tres contratos no cruzan al motor, así que los pasos (2)–(4) del
  procedimiento de la Sección 07 no aplican hasta que lo hagan. Viven aquí versionados y cubiertos
  por el test de drift.
- **`AmplifierSpec.powerPerChannelW` indexado por impedancia**, con `"8"` obligatorio y el resto
  opcionales. La potencia entregada depende de la carga, y el grafo la conoce de
  `SpeakerSpec.power.impedanceOhm`. Se modeló con claves fijas y no con `partialRecord` +
  `.refine("al menos una clave")` porque **`z.toJSONSchema` no representa los `.refine()`**: el
  `.schema.json` habría quedado más débil que el zod sin que nada lo avisara.
- **`ConsoleSpec.io.outputBuses` son los handles de salida**, no `auxSends` ni `matrixOutputs`. El
  doc modela la consola como N→M; los envíos auxiliares se declaran como dato de placa pero el
  grafo no los rutea en v1.
- **`MicrophoneSpec` sin directividad numérica**: el micrófono no se simula acústicamente en v1 y
  la realimentación (lo único que necesitaría integrar su patrón polar) está diferida a v2 por el
  doc. El patrón viaja como etiqueta enumerada.
- **`AmplifierSpec` es una unión discriminada, no un objeto con `powerPerChannelW` opcional.** El
  nodo `pa` cubre amplificadores y gestores de altavoces, que no entregan vatios. Se modeló como
  unión porque `z.toJSONSchema` **sí** representa las uniones (emite `oneOf`) y en cambio descarta
  los `.refine()` en silencio: así la restricción sobrevive a la copia al motor. Trampa: la
  variante `processor` es laxa, así que un `powerPerChannelW` sobrante **se tolera** — quien
  resuelva el grafo debe mirar `kind`, no la presencia del campo.
- **`SourceSpec` es la mitad del nodo `source` que vive en la app.** La Sección 5.1 se contradecía
  («cada nodo referencia un ítem de catálogo» vs. «tabla interna»); el reparto acordado es:
  catálogo = qué fuentes existen y cómo se describen, motor = espectro por banda. Por eso no
  declara `programSpectrum`: ese mapeo es de Fase 2.
- **Scattering derivado por familia de superficie.** Ninguna tabla de absorción publica s: α y s se
  miden en ensayos distintos (ISO 354 e ISO 17497). El doc exige s en las seis bandas pero no dice
  de dónde sale. El seed lo deriva con cinco perfiles (`lisa`, `texturada`, `porosa`, `plegada`,
  `audiencia`) en `prisma/seed/derive.ts`, anclados en el ejemplo del propio doc. Todos crecen con
  la frecuencia porque s depende del tamaño del relieve frente a λ.
- **`MaterialSpec.category` es texto libre, no enum.** A diferencia del `kind` de los equipos, no
  se puede derivar del contrato: el filtro de la UI se llena con un `distinct` en BD. Convención en
  uso: español, minúsculas, sin tildes.
- **Campo `dataSource` en los ítems del seed.** La regla (3) de ingesta preserva campos
  desconocidos, y se aprovecha para que cada datasheet cargado declare qué se transcribió de la
  ficha y qué se derivó. No está en el contrato a propósito: es metadato de procedencia, no parte
  del datasheet.
- **α hasta 1.2** en `MaterialSpec.absorption`: los coeficientes Sabine medidos en cámara
  reverberante (ISO 354) superan 1.0 por difracción de bordes, y las tablas estándar traen
  valores como 1.05. `scattering` sí queda acotado a [0, 1] porque es una fracción real.
- **`RoomGeometry`: la k-ésima superficie de tipo `wall` es la arista k del footprint** (vértice k →
  k+1). El contrato no podía expresarlo —`surfaces` es una lista y los ids son opacos— y sin la
  convención el reparto de materiales solo funciona en plantas rectangulares con muros nombrados por
  punto cardinal, que es lo que hace CANON-01 y no generaliza. De ella cuelga el marco local de las
  aberturas: `rect` mide `x` desde el primer vértice de la arista e `y` desde el piso. Fijada en
  Fase 3 al escribir el editor 2D; **el JSON Schema no cambia** (es documentación, no un campo), pero
  `aura-engine/contracts` tiene que llevar la misma nota antes de escribir `room_builder.py`.
- **`zones.audience` mínimo 1**: sin zona de audiencia no hay grilla de escucha que calcular.
- **`ism.maxOrder` 0–17**: el tope es el que expone la UI avanzada.
- **`bands` restringido a las seis bandas de octava** de la Sección 02.
- **`meta.methodsUsed`** usa `sabine | eyring | hybrid | direct_field` — el método realmente
  ejecutado, distinto de `config.methods` (`statistical` se resuelve a Sabine o Eyring según ᾱ).

## Abierto

- **`height.type: "gable"` queda para v2.** Sigue declarado en el contrato pero sin parámetros de
  cumbrera, así que el motor lo trataría igual que `"flat"`. Decisión de Fase 3 (§14 del doc
  maestro): el editor 2D solo emite `"flat"` —su documento interno ni siquiera representa la otra
  variante— y el techo a dos aguas entra cuando el contrato gane sus parámetros por el procedimiento
  de la Sección 07.

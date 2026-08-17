# aura-admin

App de administración de **AURA** — simulación acústica de recintos cerrados.
Next.js 16 · React 19 · Prisma 7 · PostgreSQL · better-auth · Tailwind 4.

Es la mitad con estado del sistema: **dueña del esquema de base de datos, de la autenticación y de
los contratos**. La otra mitad, el cálculo, vive en un repositorio aparte (`aura-engine`) y no sabe
nada de usuarios ni de sesiones.

---

## Qué hace

Un proyecto agrupa **escenas**, y cada escena recorre una máquina de estados de cuatro pasos:

| Estado | Qué significa |
|---|---|
| `DRAFT` | Escena creada, todavía sin nada dentro |
| `FLOW_READY` | El grafo de señal está resuelto: micrófono → consola → amplificador → parlante |
| `ROOM_READY` | La sala está definida: geometría, materiales por superficie y ambiente |
| `SIMULATED` | El motor devolvió resultados y hay algo que leer |

Alrededor de eso:

- **Editor de sala 2D** — se traza la planta sobre un lienzo, con muros, pilares y zona de
  audiencia, y se asigna material a cada superficie.
- **Vista 3D** — el mismo recinto en volumen, para colocar y orientar los parlantes.
- **Editor de flujo de señal** — grafo nodal del que solo dos escalares ya resueltos llegan a
  cruzar la frontera hacia el motor.
- **Catálogos** — parlantes, materiales, micrófonos, consolas, amplificadores y fuentes, con su
  semilla de datos verificada.
- **Resultados** — mapa de nivel sonoro sobre la grilla de audiencia, métricas por banda, alertas
  y recomendaciones de tratamiento.

---

## La frontera con el motor

El motor es una **función pura** (ADR-03): recibe un payload autocontenido firmado con HMAC,
calcula en segundo plano y entrega por callback a `POST /api/internal/jobs/:jobId`. Nunca toca la
base de datos.

Todo lo que esta app necesita saber del motor —contrato, firma, callbacks, códigos de error— está
en `../aura-engine/README.md`. **Léelo ahí:** una copia en este repositorio deriva, y ya pasó una
vez.

Un job que deja de dar señales lo caduca el cron de `/api/internal/cron/expire-jobs`, declarado en
[`vercel.json`](vercel.json) cada cinco minutos y protegido por `CRON_SECRET`.

---

## Puesta en marcha

Requiere Node 22 y pnpm 10, más un PostgreSQL al que apuntar.

```bash
pnpm install
cp .env.example .env        # y rellenar: ahí está documentada cada variable
pnpm prisma migrate deploy
pnpm db:seed                # catálogos
pnpm dev
```

No hace falta levantar el motor para trabajar en la app: `ENGINE_MODE=mock` es el valor por
defecto.

### Modos del motor

Los tres modos de simulacro **no** hablan con `aura-engine`, pero **sí** con `/api/internal/jobs`
de esta misma app: los cuatro recorren el mismo camino de ingesta, así que un fallo en las rutas se
ve igual en `mock`.

| `ENGINE_MODE` | Qué devuelve |
|---|---|
| `mock` | `canon-01.expected.json` tal cual — los números del caso canónico |
| `mock-full` | Lo amplía con grilla, alertas y recomendaciones derivadas de la sala enviada. Sirve para recorrer la pantalla de resultados entera, pero **sus cifras no son física** |
| `mock-fail` | El camino de error: el job termina `FAILED` con su código |
| `http` | El motor de verdad, en `ENGINE_URL` |

---

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm test` | Tests unitarios (vitest) — puros, sin base de datos |
| `pnpm test:integration` | Authz por rol y transiciones de estado contra Postgres de verdad |
| `pnpm test:e2e` | Camino feliz completo (Playwright) |
| `pnpm typecheck` | `next typegen` + `tsc --noEmit` |
| `pnpm lint` · `pnpm format` | Biome |
| `pnpm contracts:build` | Regenera `src/contracts/*.schema.json` desde los zod |
| `pnpm prisma migrate dev` | Nueva migración |
| `pnpm db:seed` | Siembra los catálogos |

`pnpm test:integration` lee **`TEST_DATABASE_URL`, no `DATABASE_URL`**, y a propósito: estos tests
crean y borran filas. Si la variable está vacía se saltan solos, que es preferible a que se lleven
por delante datos de desarrollo.

El [CI](.github/workflows/ci.yml) corre las tres capas contra un Postgres efímero, más lint,
typecheck y build.

---

## Contratos

Los `*.schema.ts` (zod) de [`src/contracts/`](src/contracts/) son **la fuente de verdad** del
formato que cruza entre los dos repositorios. De ahí salen los `*.schema.json` con
`pnpm contracts:build`, y de esos se copian al motor los que necesita.

**Los `.json` son artefactos generados: no se editan a mano.** Cambiar un contrato exige el
procedimiento de dos PRs enlazados, **motor primero** —entrada estricta, salida laxa— para que
desplegar el motor antes no rompa la app. Está detallado en
[`src/contracts/README.md`](src/contracts/README.md).

---

## Estructura

```
src/
  app/            rutas (App Router) — (app), (auth), (marketing), api/
  features/       una carpeta por dominio: schemas → actions → components
  contracts/      los zod compartidos con el motor, y sus JSON generados
  components/     UI compartida (shadcn en ui/)
  lib/            db, auth, authz, cliente del motor
prisma/           esquema, migraciones y semillas de catálogo
docs/             runbook de backups y revisión de seguridad
e2e/              Playwright
```

Las convenciones que el código respeta —límites de tamaño por archivo, `resolveProjectAccess()`
como única puerta de autorización de proyectos, unidades en los nombres (`levelDb`, `delayMs`,
`temperatureC`)— están en [`CLAUDE.md`](CLAUDE.md).

---

## Documentación

- [`docs/security-review.md`](docs/security-review.md) — revisión de seguridad de esta mitad.
- [`docs/runbook-backups.md`](docs/runbook-backups.md) — copias, restauración y por qué un backup
  sin su `APP_ENCRYPTION_KEY` es medio backup.

El documento maestro del proyecto es la fuente de verdad ante cualquier conflicto. No está
versionado ni se publica: vive solo en la copia local de quien trabaja el repositorio.

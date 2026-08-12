# Revisión de seguridad — v1

Lo que pide la Fase 7 de la Sección 12: **HMAC, cifrado y authz**. Qué se revisó, qué se encontró,
qué se arregló y qué se acepta a sabiendas.

Fecha: agosto de 2026 · Alcance: `aura-admin` en la rama `feat/phase-7-hardening`.
La mitad del motor se revisa en su propio repo (una tarea nunca toca los dos).

---

## 1 · Superficie expuesta

| Entrada | Quién autoriza | Estado |
|---|---|---|
| Páginas y Server Actions | `getActiveUser()` → `resolveProjectAccess()` | ✅ |
| Catálogos (18 actions) | `requireSuperAdmin()` | ✅ |
| `POST /api/internal/jobs/:jobId` | Firma HMAC | ✅ |
| `POST /api/internal/jobs/:jobId/progress` | Firma HMAC | ✅ |
| `GET /api/internal/cron/expire-jobs` | Bearer `CRON_SECRET` | ⚠️ → arreglado |
| `/api/auth/*` | Better Auth | ✅ |

**Barrido de authz.** Las 40 Server Actions del repo pasan por una de las tres puertas. Las dos
únicas que no —`sign-in` y `sign-up`— son las que crean la sesión, así que es correcto.

`/api/internal` está fuera del matcher de `proxy.ts` a propósito: ahí no hay cookie que mirar, la
firma ES la autorización. Es la excepción documentada a "todo pasa por `resolveProjectAccess`", y
está escrita en la cabecera de `engine-callback.ts`.

**Verificado además con tests de integración contra Postgres** (`project-access.test.ts`): que un
VIEWER no pueda lo de un EDITOR, que la membresía de otro proyecto no dé acceso a este, y que a
quien no tiene acceso se le responda `NOT_FOUND` y no `FORBIDDEN` — distinguirlos le confirmaría a
un extraño que ese proyecto existe.

---

## 2 · Hallazgos

### 2.1 · Bearer del cron comparado con `!==` — **arreglado**

`src/app/api/internal/cron/expire-jobs/route.ts`

Comparación no constante sobre un secreto, en una ruta pública que se puede sondear sin límite: el
tiempo de respuesta filtra cuántos caracteres iniciales acertó quien prueba. `secretsMatch()` ya
existía en `crypto.ts` —con `timingSafeEqual` dentro— y no lo usaba nadie.

Arreglado usándolo. Es el mismo criterio que la verificación de la firma HMAC, que sí lo hacía bien
desde el principio.

### 2.2 · Ventana de repetición del HMAC — **aceptado, y ahora probado**

La firma cubre `timestamp.body` y la ventana es de ±300 s (ADR 0009). Firmar solo el cuerpo dejaría
esa ventana indefensa: bastaría reemitir el mismo par. Con el timestamp dentro, un reenvío solo
sirve dentro de esos cinco minutos.

No hay nonce, así que **dentro de la ventana un callback capturado se puede repetir**. Se acepta
porque la ingesta es idempotente por diseño, no por casualidad:

- un job ya terminado devuelve `already_finished` y no escribe nada;
- se responde `200` y nunca 4xx, porque el motor trata cualquier 4xx como fatal;
- repetir un resultado no duplica filas de `SimResult`.

Eso último era una propiedad de la que nadie había dejado constancia. Ahora la fija un test de
integración (`job-lifecycle.test.ts` → *"repetir el callback no duplica resultados"*).

Añadir un nonce exigiría estado compartido entre las dos apps —justo lo que ADR-02 y ADR-03
impiden— para defenderse de un atacante que ya está leyendo el tráfico interno.

### 2.3 · Fugas de secretos en logs — **arreglado en la Sección 2 de esta fase**

Al escribir el test del filtro aparecieron dos huecos reales:

1. una API key de usuario bajo un nombre de campo inocente (`{ traza: "sk-ant-…" }`) sobrevivía a
   las dos primeras redes;
2. el **mensaje** del log no se filtraba, solo sus campos, así que `"el proveedor rechazó <clave>"`
   salía entero.

Los dos están cerrados y cubiertos por `scrub-secrets.test.ts`.

---

## 3 · Revisado y correcto

**Cifrado en reposo (ADR-08).** AES-256-GCM, no CBC: GCM autentica además de cifrar, así que una
fila manipulada falla al descifrar en vez de devolver basura que acabaría viajando al proveedor.
IV aleatorio de 12 bytes por cada cifrado, delante del texto cifrado, sin forma de pasarlo desde
fuera — reutilizar un IV con la misma clave rompe GCM del todo. La clave se exige de 32 bytes y el
descifrado devuelve `null` sin distinguir "etiqueta inválida" de "clave equivocada", que no le
sirve a quien llama y sí a quien sondea.

**La API key nunca vuelve al cliente.** `getLlmSettings` devuelve `hasApiKey` y los últimos cuatro
caracteres, jamás la clave (ADR-08). El formulario sale vacío y una clave vacía significa "deja la
que había", así que reenviarlo para cambiar solo el proveedor no borra nada.

**La API key no entra en la base en claro ni en el hash.** Se añade al payload en
`enqueue-simulation` DESPUÉS de guardar `Simulation.request`, y `requestHash` la descarta
explícitamente. Si entrara en el hash, rotar la clave marcaría como desactualizados resultados que
siguen describiendo la misma sala.

**HMAC.** `timingSafeEqual` con comprobación previa de longitud, un solo modo de fallo (no se filtra
si cayó la firma o la ventana), y verificación sobre los bytes exactos recibidos — parsear y
reserializar antes de verificar reordenaría las claves y ninguna firma cuadraría.

**Sin SQL crudo.** Cero `$queryRaw` / `$executeRaw` en todo `src/`: solo el query builder de Prisma.

**XSS.** El único `dangerouslySetInnerHTML` del repo es el de `ui/chart.tsx` de shadcn, que inyecta
variables CSS derivadas del `ChartConfig` escrito en código, no de datos de usuario.

---

## 4 · Deuda declarada, no hallazgos

- **`UNAUTHORIZED` fuera del envelope del motor.** El 401 responde `{"detail": "unauthorized"}` en
  vez del envelope uniforme porque ninguno de los seis códigos del contrato describe un fallo de
  autenticación. Es deuda de contrato con ADR (0009), no un defecto de esta app.
- **Sin límite de intentos en `/api/internal`.** No se implementa en v1: son rutas internas y la
  firma corta cualquier petición no firmada antes de tocar la base. Cuando haya despliegue, el
  sitio de esto es la plataforma, no el código.

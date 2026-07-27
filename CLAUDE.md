@AGENTS.md

# AURA — aura-admin

## Qué es
App de administración de AURA (simulación acústica de recintos cerrados). Doc maestro:
`develop-plan.html` (raíz del repo) — fuente de verdad; ante conflicto, gana el doc.

## Comandos
pnpm dev · pnpm test · pnpm biome check --write · pnpm prisma migrate dev · pnpm typecheck

## Reglas duras (resumen de secciones 5 y 9 del doc maestro)
- Cabecera con ruta y propósito en TODO archivo.
- Límites: componente ≤120 líneas · action ≤80 (1 por archivo) · función ≤30.
- CRUD siempre: schemas(zod) → actions("use server"+authz) → useActionState.
- Authz de proyectos SOLO vía resolveProjectAccess(). Prisma solo en queries/actions.
- Comentarios: solo POR QUÉ / física / trampa / limitación. Cero narración o changelog.
- Contratos en src/contracts/ NO se editan sin el procedimiento de la sección 7 del doc maestro.
- Unidades en los nombres: levelDb, delayMs, temperatureC.

## Contexto rápido
Estados de escena: DRAFT→FLOW_READY→ROOM_READY→SIMULATED. El motor vive en el repo
aura-engine (no lo toques desde aquí). ENGINE_MODE=mock devuelve canon-01.expected.json.

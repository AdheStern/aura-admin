# Fixtures de salas de prueba

`RoomDocument` v1 completos (Tarea 3 de la Fase 3) — el mismo formato que exporta/importa el editor
(`ImportExportControls`) y que persiste `Scene.room`. Cada uno se valida en
`src/features/room-editor/__tests__/room-fixtures.test.ts` contra el pipeline completo: `parseRoom`
→ `validateRoom` → `toRoomGeometry` → `roomGeometrySchema` (el contrato real que consume el motor).

| Archivo | Qué ejercita |
|---|---|
| `shoebox-small.json` | El caso mínimo: rectángulo, una zona de audiencia, sin escenario ni obstáculos. Cero avisos salvo materiales. |
| `shoebox-with-stage.json` | Las dimensiones de CANON-01 (20×12×6 m, sección A.1 del doc maestro) con escenario + audiencia — el mismo recinto que ancla el caso analítico del motor, ahora dibujable en el editor. |
| `l-shaped-room.json` | Footprint cóncavo (hexágono en L, 6 muros): la zona de audiencia respeta la muesca sin tener que ser ella misma un polígono en L. |
| `room-with-pillars-and-openings.json` | Los cinco tipos de figura a la vez: 2 pilares (rect + círculo), 1 ventana y 1 puerta sobre muros distintos. Los pilares caen dentro de la audiencia a propósito — `OBSTACLE_OVER_AUDIENCE` es la sombra real que la Fase 5 va a calcular, no un error de la fixture. |

**`materialId` siempre `null`.** A propósito: un id de material real acoplaría estas fixtures al
seed del catálogo (Fase 1), que puede cambiar. `MATERIAL_NOT_ASSIGNED` es un aviso, no un error —
las cuatro salas llegan a `isComplete: true` igual, que es lo que importa aquí.

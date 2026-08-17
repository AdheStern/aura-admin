# Runbook — copias de seguridad y restauración

Qué hacer para que un borrado accidental o una migración mal aplicada no se lleven el trabajo de
los usuarios, y —sobre todo— cómo comprobar que la copia sirve **antes** de necesitarla.

La Sección 10 del doc maestro fija el objetivo: *"backups automáticos + PITR en prod"*.

## Lo que hay que saber antes de nada

**La base de datos NO contiene todo lo necesario para restaurar el servicio.**

Las API keys de LLM de los usuarios se guardan cifradas con AES-256-GCM (ADR-08), y la llave está
en `APP_ENCRYPTION_KEY`, que vive en el entorno y **no** en Postgres. Restaurar un volcado en un
proyecto nuevo con otra `APP_ENCRYPTION_KEY` deja esas columnas ilegibles: la app las trata como
"no hay clave" —degrada a plantillas, no revienta— pero cada usuario tendrá que volver a pegar la
suya y nadie le habrá avisado.

> **Guarda `APP_ENCRYPTION_KEY` con la misma seriedad que el backup, y en otro sitio.** Un backup
> sin su llave es medio backup.

Lo mismo, en menor grado, con `ENGINE_SHARED_SECRET`: sin él la app y el motor dejan de hablarse.

## Qué cubre Supabase

| Plan | Qué da | Ventana |
|---|---|---|
| Free | Copia diaria automática | 7 días, y solo descarga manual |
| Pro | Copia diaria + **PITR** como add-on | PITR restaura a cualquier segundo dentro de la ventana contratada |

PITR (*point-in-time recovery*) es lo que la Sección 10 pide para producción, y es lo que
diferencia "perdimos como mucho un día" de "perdimos como mucho un minuto". No viene activado.

**Activarlo:** Supabase → proyecto de producción → *Database* → *Backups* → pestaña *Point in
Time* → *Enable PITR*. Requiere plan Pro y se cobra aparte por ventana de retención.

## Restaurar

1. **Parar de escribir.** Si la app sigue en pie, quítale el acceso (pausa el proyecto de Vercel o
   revoca `DATABASE_URL`) antes de restaurar: restaurar por debajo de una app viva mezcla datos
   viejos con escrituras nuevas y deja un estado que no es ni el de antes ni el de después.
2. **Elegir el instante.** En *Backups → Point in Time*, el segundo anterior al desastre. Si solo
   hay copia diaria, la del día anterior.
3. **Restaurar.** Supabase lo hace sobre el mismo proyecto; tarda en función del tamaño.
4. **Comprobar el esquema.** `pnpm prisma migrate status` contra la base restaurada. Si el
   desastre fue una migración, la copia es anterior a ella y `migrate deploy` la vuelve a aplicar —
   asegúrate de que la migración esté arreglada antes de correrlo.
5. **Comprobar los secretos.** Que `APP_ENCRYPTION_KEY` sea **la misma** que cuando se cifraron las
   claves. Si cambió, ver el aviso de arriba.
6. **Camino dorado.** Entrar, abrir un proyecto, abrir una escena, simular. Si eso funciona, el
   servicio está de vuelta.

## El simulacro, que es la única parte que importa de verdad

Un backup que nadie ha restaurado nunca no es un backup: es una suposición. Una vez al trimestre,
y siempre después de tocar el esquema:

1. Crear un proyecto de Supabase nuevo y vacío.
2. Restaurar allí la copia de producción (*Restore to new project*, o el volcado descargado).
3. Apuntar una copia local de la app a esa base:
   `DATABASE_URL="<la nueva>" pnpm build && pnpm start`
4. Correr el camino dorado contra ella, a mano o con `pnpm test:e2e` apuntando ahí.
5. **Anotar cuánto se tardó desde el paso 1 hasta que la app respondió.** Ese número es el tiempo
   de recuperación real, y es el único dato honesto que se puede dar cuando alguien pregunte
   "¿cuánto tardaríamos en volver?".
6. Borrar el proyecto de prueba.

## Lo que no hace falta respaldar

- **Los catálogos** (materiales, parlantes, consolas, amplificadores, micrófonos, fuentes) se
  regeneran con `pnpm db:seed`: son curaduría versionada en `prisma/seed/`, no datos de usuario.
- **`SimResult`** se puede recalcular volviendo a simular, siempre que sobrevivan la escena y su
  `Simulation.request`. Recuperarlos es más barato que restaurar.

Lo irremplazable son `User`, `Project`, `Scene` y `UserSettings`: horas de trabajo de alguien.

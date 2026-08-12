// src/test/integration-setup.ts — apunta Prisma a la base de PRUEBAS antes de que nadie la importe.
//
// `src/lib/db.ts` lee DATABASE_URL al importarse y guarda el cliente en un singleton, así que esto
// tiene que correr antes: por eso es un `setupFiles` y no un `beforeAll`.
//
// SEGURIDAD, y es el motivo de que exista este archivo: sin TEST_DATABASE_URL NO se cae de vuelta a
// DATABASE_URL. Estos tests crean y borran filas, y la DATABASE_URL de una máquina de desarrollo
// apunta a la Supabase real — heredarla convertiría `pnpm test:integration` en un borrado de datos
// de verdad. Sin base de pruebas se apunta a un destino inexistente y los describe se saltan solos.

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://sin-base-de-pruebas@127.0.0.1:1/vacio";

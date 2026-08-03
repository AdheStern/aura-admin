// prisma/seed.ts — carga inicial de los cinco catálogos (última tarea de Fase 1 del roadmap).
// Se invoca con `pnpm db:seed`: Prisma 7 no ejecuta el seed solo en migrate dev/reset.
// Es idempotente — correrlo dos veces deja la BD igual — y todo entra con verified:false, porque
// la revisión humana de los datos es un paso posterior que el propio roadmap exige.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { amplifierSpecSchema } from "../src/contracts/amplifier-spec.schema";
import { consoleSpecSchema } from "../src/contracts/console-spec.schema";
import { materialSpecSchema } from "../src/contracts/material-spec.schema";
import { microphoneSpecSchema } from "../src/contracts/microphone-spec.schema";
import { speakerSpecSchema } from "../src/contracts/speaker-spec.schema";
import { AMPLIFIERS } from "./seed/amplifiers";
import { CONSOLES } from "./seed/consoles";
import { MATERIAL_SPECS } from "./seed/materials";
import { MICROPHONES } from "./seed/microphones";
import { SPEAKERS } from "./seed/speakers";
import { toEquipmentRecords, upsertAll, upsertMaterials } from "./seed/upsert";

// Cliente propio: src/lib/db.ts es un singleton global pensado para el HMR de Next que nunca
// cierra la conexión, y dejaría el script colgado. Prisma 7 exige driver adapter.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Sembrando catálogos…\n");

  await upsertMaterials(prisma, materialSpecSchema, MATERIAL_SPECS);

  await upsertAll(
    "parlantes",
    toEquipmentRecords("Parlantes", SPEAKERS, speakerSpecSchema),
    (record) =>
      prisma.catalogSpeaker.upsert({
        where: { brand_model: { brand: record.brand, model: record.model } },
        create: record,
        update: record,
      }),
  );

  await upsertAll(
    "micrófonos",
    toEquipmentRecords("Micrófonos", MICROPHONES, microphoneSpecSchema),
    (record) =>
      prisma.catalogMicrophone.upsert({
        where: { brand_model: { brand: record.brand, model: record.model } },
        create: record,
        update: record,
      }),
  );

  await upsertAll(
    "consolas",
    toEquipmentRecords("Consolas", CONSOLES, consoleSpecSchema),
    (record) =>
      prisma.catalogConsole.upsert({
        where: { brand_model: { brand: record.brand, model: record.model } },
        create: record,
        update: record,
      }),
  );

  await upsertAll(
    "amplificadores",
    toEquipmentRecords("Amplificadores", AMPLIFIERS, amplifierSpecSchema),
    (record) =>
      prisma.catalogAmplifier.upsert({
        where: { brand_model: { brand: record.brand, model: record.model } },
        create: record,
        update: record,
      }),
  );

  console.log("\nSeed completo. Todos los ítems entran sin verificar.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

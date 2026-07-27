// scripts/generate-json-schemas.ts — emite los .schema.json canónicos desde los contratos zod.
// Los .json versionados son el artefacto que se copia tal cual a aura-engine/contracts
// (paso 2 del procedimiento de la Sección 07). Se regeneran, no se editan a mano:
// `pnpm contracts:build`, y el test de drift falla si alguien los toca por su cuenta.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { CONTRACTS, toContractJsonSchema } from "../src/contracts/registry";

const CONTRACTS_DIR = path.join(process.cwd(), "src", "contracts");

async function main() {
  for (const contract of CONTRACTS) {
    const jsonSchema = toContractJsonSchema(contract);
    const target = path.join(CONTRACTS_DIR, contract.fileName);
    await writeFile(target, `${JSON.stringify(jsonSchema, null, 2)}\n`, "utf8");
    console.log(`✓ ${contract.fileName}`);
  }
  console.log(`\n${CONTRACTS.length} JSON Schemas generados en src/contracts/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

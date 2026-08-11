// src/lib/prisma-json.ts — frontera entre los tipos del contrato y las columnas Json de Prisma.
//
// InputJsonValue no sabe expresar "un objeto que ya validó zod": exige una index signature que los
// tipos inferidos de los schemas no tienen, y trata una propiedad opcional como incompatible. El
// valor SÍ es JSON válido —viene de parsear JSON— así que el cast es cierto; lo que no es cierto es
// que TypeScript pueda demostrarlo. Concentrarlo aquí evita repartir `as any` por las queries.

import { Prisma } from "@prisma/client";

export function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

/** Para columnas `Json?`. DbNull es el NULL de la columna; JsonNull sería el literal `null`
 *  guardado DENTRO del JSON, que no es lo mismo y no es lo que queremos aquí. */
export function asNullableJson(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return value === null || value === undefined
    ? Prisma.DbNull
    : (value as Prisma.InputJsonValue);
}

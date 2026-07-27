// src/features/catalogs/actions/create-speaker.ts

"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { speakerSpecSchema } from "@/contracts/speaker-spec.schema";
import { createSpeakerSchema } from "@/features/catalogs/schemas/create-speaker";
import { parseSpecJson } from "@/features/catalogs/schemas/parse-spec-json";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function createSpeaker(
  brand: string,
  model: string,
  specJson: string,
): Promise<ActionResult<{ id: string }>> {
  const activeUser = await requireSuperAdmin();
  if (!activeUser.ok) return activeUser;

  const parsed = createSpeakerSchema.safeParse({ brand, model, specJson });
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Datos inválidos",
      },
    };
  }

  const spec = parseSpecJson(speakerSpecSchema, parsed.data.specJson);
  if (!spec.ok) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: spec.message },
    };
  }

  try {
    const speaker = await db.catalogSpeaker.create({
      data: {
        brand: parsed.data.brand,
        model: parsed.data.model,
        category: spec.data.kind,
        spec: spec.data as Prisma.InputJsonValue,
        specVersion: spec.data.schemaVersion,
      },
      select: { id: true },
    });

    revalidatePath("/catalogs/speakers");
    return { ok: true, data: { id: speaker.id } };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Ya existe un parlante con esa marca y modelo",
        },
      };
    }
    throw error;
  }
}

// src/features/catalogs/actions/update-speaker.ts

"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { speakerSpecSchema } from "@/contracts/speaker-spec.schema";
import { parseSpecJson } from "@/features/catalogs/schemas/parse-spec-json";
import { updateSpeakerSchema } from "@/features/catalogs/schemas/update-speaker";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function updateSpeaker(
  speakerId: string,
  brand: string,
  model: string,
  specJson: string,
  verified: boolean,
): Promise<ActionResult> {
  const activeUser = await requireSuperAdmin();
  if (!activeUser.ok) return activeUser;

  const parsed = updateSpeakerSchema.safeParse({
    speakerId,
    brand,
    model,
    specJson,
    verified,
  });
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
    await db.catalogSpeaker.update({
      where: { id: parsed.data.speakerId },
      data: {
        brand: parsed.data.brand,
        model: parsed.data.model,
        category: spec.data.kind,
        spec: spec.data as Prisma.InputJsonValue,
        specVersion: spec.data.schemaVersion,
        verified: parsed.data.verified,
      },
    });
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

  revalidatePath("/catalogs/speakers");
  revalidatePath(`/catalogs/speakers/${parsed.data.speakerId}`);
  return { ok: true };
}

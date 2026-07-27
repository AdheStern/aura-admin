// src/features/auth/actions/sign-in.ts — inicio de sesión con email/password
"use server";

import { APIError } from "better-auth/api";
import { signInSchema } from "@/features/auth/schemas";
import { auth } from "@/lib/auth";

type ActionResult = { success: boolean; message: string };

export async function signInAction(
  email: string,
  password: string,
): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({ email, password });
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  try {
    await auth.api.signInEmail({ body: parsed.data });
    return { success: true, message: "Inicio de sesión exitoso" };
  } catch (error) {
    if (error instanceof APIError) {
      return { success: false, message: error.message };
    }
    throw error;
  }
}

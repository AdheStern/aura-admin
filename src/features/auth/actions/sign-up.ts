// src/features/auth/actions/sign-up.ts — registro con email/password
"use server";

import { APIError } from "better-auth/api";
import { signUpSchema } from "@/features/auth/schemas";
import { auth } from "@/lib/auth";

type ActionResult = { success: boolean; message: string };

export async function signUpAction(
  email: string,
  password: string,
  name: string,
): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({ email, password, name });
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  try {
    await auth.api.signUpEmail({ body: parsed.data });
    return { success: true, message: "Registro exitoso" };
  } catch (error) {
    if (error instanceof APIError) {
      return { success: false, message: error.message };
    }
    throw error;
  }
}

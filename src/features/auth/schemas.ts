// src/features/auth/schemas.ts — validación de los formularios de login y registro

import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Ingresa un email válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  name: z.string().min(2, "Ingresa tu nombre"),
  email: z.email("Ingresa un email válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

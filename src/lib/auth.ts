// src/lib/auth.ts

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, organization } from "better-auth/plugins";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Cambiar a true en producción
  },

  // Campos de dominio AURA sobre User (Sección 4.0 del doc maestro): declarados aquí
  // para que Better Auth los conozca, validados como enum con zod en cada action —
  // nunca con constraint de BD, para no pelear con la librería.
  user: {
    additionalFields: {
      status: {
        type: "string",
        required: false,
        defaultValue: "ACTIVE", // UserStatus: ACTIVE | SUSPENDED | INVITED (zod)
        input: false,
      },
      departmentId: {
        type: "string",
        required: false,
        input: false,
      },
      managerId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // Actualizar sesión cada 24 horas
  },

  plugins: [
    // Plugin de administración
    admin({
      impersonationSessionDuration: 60 * 60, // 1 hora
    }),

    // Plugin de organizaciones
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5, // Límite de organizaciones por usuario
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 días
    }),

    // nextCookies() reenvía el Set-Cookie de auth.api.* a next/headers cuando se llama
    // desde una Server Action. Debe ir último: así ve las cookies que setean los plugins
    // anteriores (Better Auth avisa si no es el último y algún plugin declara hooks.after).
    nextCookies(),
  ],

  // Configuración adicional de seguridad
  advanced: {
    generateId: false, // Usar IDs generados por Prisma
    crossSubDomainCookies: {
      enabled: false,
    },
  },
});

export type Session = typeof auth.$Infer.Session;

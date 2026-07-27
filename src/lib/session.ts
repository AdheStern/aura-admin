// src/lib/session.ts — sesión real de Better Auth para Server Actions/RSC; corta baneados o con
// status distinto de ACTIVE antes de llegar a resolveProjectAccess. proxy.ts solo mira la cookie.
import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/types/action-result";

export type ActiveUser = {
  id: string;
  name: string;
  email: string;
  role: string | null;
};

export const getActiveUser = cache(
  async (): Promise<ActionResult<ActiveUser>> => {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return {
        ok: false,
        error: { code: "UNAUTHENTICATED", message: "No hay sesión activa" },
      };
    }

    const { user } = session;
    const status = (user as { status?: string | null }).status ?? "ACTIVE";

    if (user.banned || status !== "ACTIVE") {
      return {
        ok: false,
        error: {
          code: "ACCOUNT_INACTIVE",
          message: "Cuenta inactiva o suspendida",
        },
      };
    }

    return {
      ok: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role ?? null,
      },
    };
  },
);

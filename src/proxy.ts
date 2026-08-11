// src/proxy.ts — reemplaza a middleware.ts en Next.js 16 (mismo comportamiento, otro nombre)
// Chequeo optimista de cookie: NO valida la sesión contra la BD, solo su presencia. La
// autorización real (¿existe, expiró, el usuario sigue activo?) se resuelve en cada
// página/action — este proxy solo evita el viaje redondo a una ruta protegida sin cookie.

import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Todo excepto: landing, login/registro, el handler de Better Auth, y assets/Next internos.
  //
  // api/internal queda fuera porque ahí no hay cookie que mirar: son los callbacks del motor, que
  // se autorizan con HMAC (src/lib/engine-signature.ts). Sin esta excepción el motor recibiría un
  // 307 hacia /login, que su _deliver no cuenta ni como éxito ni como 4xx: gastaría sus tres
  // intentos y marcaría FAILED todos los jobs.
  matcher: [
    "/((?!login|register|api/auth|api/internal|_next/static|_next/image|favicon.ico|$).*)",
  ],
};

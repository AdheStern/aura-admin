// src/app/api/internal/cron/expire-jobs/route.ts — el cron ligero de la Sección 08.
//
// Cuelga de /api/internal (fuera del matcher de src/proxy.ts) porque tampoco aquí hay sesión: lo
// llama un programador, no una persona. No usa el HMAC del motor —quien dispara esto no es el
// motor y no comparte su secreto— sino el bearer de CRON_SECRET, que es lo que manda Vercel Cron.
//
// GET y no POST porque Vercel Cron solo hace GET. No es una lectura, pero es idempotente: correrlo
// dos veces seguidas caduca los mismos jobs y la segunda vez no encuentra ninguno.

import { expireStaleJobs } from "@/features/simulation/queries/expire-stale-jobs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("Authorization") !== `Bearer ${secret}`) {
    return Response.json({ detail: "unauthorized" }, { status: 401 });
  }

  return Response.json({ expired: await expireStaleJobs() });
}

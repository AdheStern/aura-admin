// src/app/(app)/catalogs/layout.tsx — gate único de /catalogs/*: requireSuperAdmin() →
// notFound() (no revela que la sección existe a quien no tiene acceso, mismo criterio que
// requireProjectRole). Las páginas hijas no repiten este chequeo; las actions sí, siempre.

import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requireSuperAdmin } from "@/lib/session";

export default async function CatalogsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const activeUser = await requireSuperAdmin();
  if (!activeUser.ok) {
    notFound();
  }

  return children;
}

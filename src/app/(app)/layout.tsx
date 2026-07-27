// src/app/(app)/layout.tsx — layout del área autenticada; defensa en profundidad más allá del
// cookie-check de proxy.ts (aquí se resuelve la sesión real y se corta baneados/inactivos).

import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { getActiveUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4 sm:px-10">
        <Link
          href="/projects"
          className="font-heading text-lg font-bold tracking-tight"
        >
          AURA
        </Link>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{activeUser.data.name}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col px-6 py-8 sm:px-10">
        {children}
      </main>
    </div>
  );
}

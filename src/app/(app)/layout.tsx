// src/app/(app)/layout.tsx — layout del área autenticada; defensa en profundidad más allá del
// cookie-check de proxy.ts (aquí se resuelve la sesión real y se corta baneados/inactivos).

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getActiveUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar activeUser={activeUser.data} />
      <SidebarInset>
        <header className="flex items-center border-b px-4 py-3">
          <SidebarTrigger />
        </header>
        <main className="flex flex-1 flex-col px-6 py-8 sm:px-10">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

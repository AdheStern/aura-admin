// src/app/(app)/layout.tsx — layout del área autenticada; defensa en profundidad más allá del
// cookie-check de proxy.ts (aquí se resuelve la sesión real y se corta baneados/inactivos).

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppMain } from "@/components/app-main";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getActiveUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    // La cabecera cruza la ventana entera y el sidebar arranca DEBAJO. Así, al plegarse a iconos,
    // la franja de arriba no se mueve y el rail queda de una pieza: el logo se pliega con el resto
    // del menú en vez de quedar suelto a la altura de la cabecera.
    //
    // La altura de la cabecera se declara UNA vez, aquí: el sidebar y los editores restan esta
    // variable para llenar la ventana sin desbordarla, y dos cifras distintas darían un scroll
    // fantasma.
    <SidebarProvider
      defaultOpen={defaultOpen}
      className="flex flex-col"
      style={{ "--header-height": "3.5rem" } as React.CSSProperties}
    >
      <SiteHeader />
      <div className="flex flex-1">
        <AppSidebar activeUser={activeUser.data} />
        <SidebarInset className="h-[calc(100svh-var(--header-height))] min-h-0 overflow-hidden">
          <AppMain>{children}</AppMain>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

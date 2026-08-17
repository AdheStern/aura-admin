// src/components/nav-user.tsx — pie del sidebar: el usuario activo y, tras él, cerrar sesión.
//
// Menú desplegable y no dos filas a la vista porque el sidebar se pliega a 3rem: plegado solo cabe
// el avatar, y con el botón suelto cerrar sesión desaparecía hasta volver a desplegar el menú.

import { ChevronsUpDownIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SignOutItem } from "@/features/auth/components/sign-out-item";

export function NavUser({ user }: { user: { name: string; email: string } }) {
  const initials = user.name.slice(0, 2).toUpperCase();

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                />
              }
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">
                  {user.name}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="min-w-56">
              {/* El nombre se repite dentro del menú: plegado el sidebar, el disparador es solo un
                  avatar y esta sería la única pista de con qué cuenta se está a punto de salir. */}
              <div className="flex items-center gap-2 px-1.5 py-1 text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <SignOutItem />
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}

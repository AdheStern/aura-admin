// src/components/nav-user.tsx — footer del sidebar: usuario + cerrar sesión.
// Sin dropdown: esta app todavía no tiene Ajustes/Facturación/etc. detrás de un menú.

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SignOutButton } from "@/features/auth/components/sign-out-button";

export function NavUser({ user }: { user: { name: string; email: string } }) {
  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center gap-2 px-2 py-1.5">
          <Avatar className="size-7">
            <AvatarFallback>
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        </SidebarMenuItem>
        <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
          <SignOutButton />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}

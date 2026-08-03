// src/components/app-sidebar.tsx — nav del área autenticada. "Catálogos" solo es visible para
// SUPER_ADMIN: el resto de /catalogs/* devuelve 404 para cualquier otro rol (ver catalogs/layout.tsx).

import { ChevronRightIcon, FolderKanbanIcon, PackageIcon } from "lucide-react";
import Link from "next/link";
import { NavUser } from "@/components/nav-user";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { CATALOG_TYPES } from "@/features/catalogs/catalog-types";
import type { ActiveUser } from "@/lib/session";

export function AppSidebar({ activeUser }: { activeUser: ActiveUser }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/projects" />}
              tooltip="AURA"
              size="lg"
            >
              <span className="font-heading text-base font-bold tracking-tight">
                AURA
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/projects" />}
                tooltip="Proyectos"
              >
                <FolderKanbanIcon />
                <span>Proyectos</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {activeUser.role === "SUPER_ADMIN" ? (
              <Collapsible defaultOpen>
                <SidebarMenuItem>
                  <CollapsibleTrigger
                    className="group"
                    render={<SidebarMenuButton tooltip="Catálogos" />}
                  >
                    <PackageIcon />
                    <span>Catálogos</span>
                    <ChevronRightIcon className="ml-auto transition-transform group-data-panel-open:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {CATALOG_TYPES.map((type) => (
                        <SidebarMenuSubItem key={type.slug}>
                          <SidebarMenuSubButton
                            render={<Link href={`/catalogs/${type.slug}`} />}
                          >
                            {type.label}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : null}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <NavUser user={activeUser} />
    </Sidebar>
  );
}

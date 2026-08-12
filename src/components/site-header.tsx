// src/components/site-header.tsx — la franja de arriba del área autenticada.
//
// Cruza la ventana entera, por encima del sidebar (ver `(app)/layout.tsx`): plegar el menú no
// mueve nada de aquí arriba.
//
// Altura por variable (`--header-height`) y no por una clase suelta: el sidebar y los editores
// calculan su alto restándola, así que si las cifras dejaran de coincidir desbordarían la ventana.

"use client";

import { PanelLeftIcon } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-50 flex h-(--header-height) w-full shrink-0 items-center gap-2 border-b bg-background px-4">
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={toggleSidebar}
        aria-label="Mostrar u ocultar el menú"
      >
        <PanelLeftIcon />
      </Button>
      <Separator orientation="vertical" className="mr-1 h-4" />
      <Breadcrumbs />
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}

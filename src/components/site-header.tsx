// src/components/site-header.tsx — la franja de arriba del área autenticada.
//
// Pegada al scroll (`sticky`) porque en los editores el contenido no se desplaza: el lienzo ocupa
// toda la altura y esta franja es el único sitio fijo desde donde se puede salir.
//
// Altura por variable (`--header-height`) y no por una clase suelta: los editores calculan su alto
// restándola, así que si las dos cifras dejaran de coincidir el lienzo desbordaría la ventana.

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
    <header className="sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background px-4">
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

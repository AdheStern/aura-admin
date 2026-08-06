// src/components/theme-provider.tsx — modo claro/oscuro sobre las variables que globals.css ya
// declara en :root y .dark (shadcn). next-themes solo pone la clase `dark` en <html>; los colores
// ya estaban definidos desde el primer día, nunca se usaban.
//
// El script de next-themes corre antes de pintar para no mostrar un destello del tema equivocado,
// y eso hace que el HTML del servidor y el del cliente difieran en esa clase: por eso el
// suppressHydrationWarning del <html> en app/layout.tsx.

"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

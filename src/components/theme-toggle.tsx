// src/components/theme-toggle.tsx — conmutador de tema en la cabecera del área autenticada.
//
// Cicla claro → oscuro → sistema en vez de ser un interruptor de dos estados: "sistema" es el
// valor por defecto y sin esta tercera parada no habría forma de volver a él una vez elegido uno.
// Hasta que next-themes hidrata no se sabe el tema real, y pintar un icono al azar provocaría un
// salto visible: por eso el placeholder del mismo tamaño.

"use client";

import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const NEXT_THEME: Record<string, string> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const LABEL: Record<string, string> = {
  light: "Tema claro",
  dark: "Tema oscuro",
  system: "Tema del sistema",
};

export function ThemeToggle() {
  const { theme = "system", setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return <div className="size-8" aria-hidden />;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={LABEL[theme] ?? LABEL.system}
      title={LABEL[theme] ?? LABEL.system}
      onClick={() => setTheme(NEXT_THEME[theme] ?? "light")}
    >
      {theme === "light" ? <SunIcon /> : null}
      {theme === "dark" ? <MoonIcon /> : null}
      {theme !== "light" && theme !== "dark" ? <LaptopIcon /> : null}
    </Button>
  );
}

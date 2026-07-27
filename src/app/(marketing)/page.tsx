import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="font-heading text-lg font-bold tracking-tight">
          AURA
        </span>
        <nav className="flex items-center gap-3">
          <Button
            render={<Link href="/login" />}
            nativeButton={false}
            variant="ghost"
          >
            Ingresar
          </Button>
          <Button render={<Link href="/register" />} nativeButton={false}>
            Crear cuenta
          </Button>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center sm:px-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Simulación acústica de recintos cerrados
        </p>
        <h1 className="mt-4 max-w-2xl text-balance font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          Predice cómo sonará tu sistema de audio antes de instalarlo
        </h1>
        <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
          AURA modela la cadena de señal, el recinto y la física del sonido para
          entregar mapas de cobertura, reverberación, claridad y recomendaciones
          accionables de instalación en iglesias, auditorios y salas.
        </p>
        <div className="mt-10 flex items-center gap-3">
          <Button
            render={<Link href="/register" />}
            nativeButton={false}
            size="lg"
          >
            Empezar gratis
          </Button>
          <Button
            render={<Link href="/login" />}
            nativeButton={false}
            size="lg"
            variant="outline"
          >
            Ya tengo cuenta
          </Button>
        </div>
      </main>
    </div>
  );
}

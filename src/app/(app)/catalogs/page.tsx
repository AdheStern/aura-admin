// src/app/(app)/catalogs/page.tsx — índice: acceso a cada tipo de catálogo.

import { PackageIcon, SpeakerIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CatalogsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Catálogos
        </h1>
        <p className="text-sm text-muted-foreground">
          Equipos y materiales con datasheet validado, disponibles para la
          cadena de señal y la simulación.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <SpeakerIcon className="size-6" />
            <CardTitle>Parlantes</CardTitle>
            <CardDescription>
              Datasheets de altavoces del catálogo.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              render={<Link href="/catalogs/speakers" />}
              nativeButton={false}
              className="w-full"
            >
              Ver parlantes
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <PackageIcon className="size-6" />
            <CardTitle>Materiales</CardTitle>
            <CardDescription>
              Coeficientes de absorción y dispersión por banda.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              render={<Link href="/catalogs/materials" />}
              nativeButton={false}
              className="w-full"
            >
              Ver materiales
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

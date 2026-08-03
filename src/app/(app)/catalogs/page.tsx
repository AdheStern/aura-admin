// src/app/(app)/catalogs/page.tsx — índice: acceso a cada tipo de catálogo.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CATALOG_TYPES } from "@/features/catalogs/catalog-types";

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATALOG_TYPES.map((type) => (
          <Card key={type.slug}>
            <CardHeader>
              <type.icon className="size-6" />
              <CardTitle>{type.label}</CardTitle>
              <CardDescription>{type.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                render={<Link href={`/catalogs/${type.slug}`} />}
                nativeButton={false}
                className="w-full"
              >
                Ver {type.label.toLowerCase()}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

// src/features/catalogs/components/catalog-category-filter.tsx — filtro por categoría vía
// ?category=. Recibe las opciones ya resueltas porque su origen cambia según el tipo: los equipos
// las derivan del enum kind de su contrato, los materiales de un distinct en BD (texto libre).

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CatalogCategoryFilter({
  basePath,
  options,
}: {
  basePath: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? "all";

  function handleChange(value: string | null) {
    const params = new URLSearchParams(searchParams);
    if (!value || value === "all") {
      params.delete("category");
    } else {
      params.set("category", value);
    }
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <Select value={category} onValueChange={handleChange}>
      <SelectTrigger className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas las categorías</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

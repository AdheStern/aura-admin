// src/features/catalogs/components/material-category-filter.tsx — category es texto libre
// (sin enum en el contrato): las opciones vienen de lo que ya existe en la BD.

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MaterialCategoryFilter({
  categories,
}: {
  categories: string[];
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
    router.push(`/catalogs/materials?${params.toString()}`);
  }

  return (
    <Select value={category} onValueChange={handleChange}>
      <SelectTrigger className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas las categorías</SelectItem>
        {categories.map((cat) => (
          <SelectItem key={cat} value={cat}>
            {cat}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

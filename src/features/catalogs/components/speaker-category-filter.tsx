// src/features/catalogs/components/speaker-category-filter.tsx

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SPEAKER_CATEGORIES,
  SPEAKER_KIND_LABEL,
} from "@/features/catalogs/schemas/speaker-categories";

export function SpeakerCategoryFilter() {
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
    router.push(`/catalogs/speakers?${params.toString()}`);
  }

  return (
    <Select value={category} onValueChange={handleChange}>
      <SelectTrigger className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas las categorías</SelectItem>
        {SPEAKER_CATEGORIES.map((cat) => (
          <SelectItem key={cat} value={cat}>
            {SPEAKER_KIND_LABEL[cat]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

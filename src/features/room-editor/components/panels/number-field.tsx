// src/features/room-editor/components/panels/number-field.tsx — el par Label+Input numérico que
// se repite en todos los paneles de propiedades (posiciones, tamaños, cotas). Un solo sitio para
// el guardia de Number.isFinite: un campo vacío o "-" a medio teclear no debe disparar un comando.

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

export function NumberField({
  id,
  label,
  value,
  step = 0.1,
  min,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  step?: number;
  min?: number;
  onChange: (value: number) => void;
}) {
  const canManage = useRoomStore((state) => state.canManage);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        step={step}
        min={min}
        value={value}
        disabled={!canManage}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(next);
        }}
      />
    </div>
  );
}

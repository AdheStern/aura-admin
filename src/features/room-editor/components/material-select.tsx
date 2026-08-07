// src/features/room-editor/components/material-select.tsx — el picker de material, reusado por
// todos los paneles de propiedades (muro, piso, techo, pilar, abertura). `null` es una opción real
// ("sin asignar", con el aviso MATERIAL_NOT_ASSIGNED del validador), no la ausencia de selección.
//
// Combobox en vez de Select: el catálogo de materiales (Fase 1) puede crecer más allá de lo que
// cabe desplazando cómodo, así que se filtra por texto. Los ids son opacos (cuid), por eso el
// filtro y la lista comparan por `itemToStringLabel`, nunca por el id crudo.

"use client";

import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/combobox";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

const UNASSIGNED_VALUE = "__unassigned__";

export function MaterialSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (materialId: string | null) => void;
}) {
  const options = useRoomStore((state) => state.materialOptions);
  const canManage = useRoomStore((state) => state.canManage);

  const labelById = new Map([
    [UNASSIGNED_VALUE, "Sin asignar"],
    ...options.map((option): [string, string] => [option.id, option.label]),
  ]);
  const items = [UNASSIGNED_VALUE, ...options.map((option) => option.id)];

  return (
    <Combobox
      items={items}
      itemToStringLabel={(id: string) => labelById.get(id) ?? id}
      value={value ?? UNASSIGNED_VALUE}
      disabled={!canManage}
      onValueChange={(next) =>
        onChange(next === UNASSIGNED_VALUE ? null : (next ?? null))
      }
    >
      <ComboboxInput
        placeholder="Buscar material…"
        className="w-full text-[11px]"
      />
      <ComboboxPopup>
        <ComboboxEmpty>Sin resultados</ComboboxEmpty>
        <ComboboxList>
          {(id: string) => (
            <ComboboxItem key={id} value={id}>
              {labelById.get(id) ?? id}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}

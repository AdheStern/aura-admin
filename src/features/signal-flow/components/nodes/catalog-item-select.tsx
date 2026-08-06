// src/features/signal-flow/components/nodes/catalog-item-select.tsx — el picker de equipo, siempre
// visible en el nodo (decisión tomada con el usuario: se ve de un vistazo qué caja es cada nodo,
// sin tener que hacer click). `nodrag` en el trigger es obligatorio en React Flow: sin esa clase,
// el mousedown para abrir el select se interpreta como el inicio de un arrastre del nodo.

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FlowNodeKind } from "@/features/signal-flow/schemas/node-kinds";
import { useFlowStore } from "@/features/signal-flow/store/flow-store-provider";

export function CatalogItemSelect({
  nodeId,
  kind,
  catalogItemId,
  placeholder,
}: {
  nodeId: string;
  kind: Exclude<FlowNodeKind, "simulation">;
  catalogItemId: string | null;
  placeholder: string;
}) {
  const options = useFlowStore((state) => state.library.options[kind]);
  const setNodeCatalogItem = useFlowStore((state) => state.setNodeCatalogItem);
  const canManage = useFlowStore((state) => state.canManage);

  // Sin `items`, <Select.Value> muestra el value crudo (el cuid) en vez de la marca/modelo: es la
  // forma que tiene Base UI de saber qué etiqueta corresponde a cada id sin que cada consumidor
  // tenga que formatear el trigger a mano.
  const items = Object.fromEntries(
    options.map((option) => [option.id, option.label]),
  );

  return (
    // value={catalogItemId} y no `?? undefined`: Base UI decide controlado/no-controlado en el
    // primer render mirando si value !== undefined, y `null` SÍ cuenta como controlado. Coercer a
    // undefined mientras no hay ítem elegido hace que el componente empiece no-controlado y salte
    // a controlado en cuanto se elige uno — el warning de React por ese cambio a mitad de vida.
    <Select
      items={items}
      value={catalogItemId}
      onValueChange={(value) => {
        if (value) setNodeCatalogItem(nodeId, value);
      }}
      disabled={!canManage}
    >
      <SelectTrigger size="sm" className="nodrag w-full text-[11px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

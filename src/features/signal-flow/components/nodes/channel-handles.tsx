// src/features/signal-flow/components/nodes/channel-handles.tsx — dibuja los FlowPort[] que
// portsOf() derivó del spec como una tira vertical compacta: un <Handle> real y arrastrable por
// canal (entradas a la izquierda, salidas a la derecha), no un handle agregado con selector
// aparte — coherente con que el dominio ya resuelve cada canal por índice (in-3/out-3).
//
// `style={{position:"static"}}` en vez de pelear con las clases de @xyflow/react a punta de
// !important: el estilo inline gana siempre, así que cada handle pasa a ocupar su fila normal del
// flex en vez de apilarse todos en el mismo punto absoluto del borde del nodo.

import { Handle, Position } from "@xyflow/react";
import type { FlowPort } from "@/features/signal-flow/model/node-ports";
import { cn } from "@/lib/utils";

/** Pasado este número de canales, la columna entra en scroll en vez de estirar el nodo sin fin. */
const SCROLL_AFTER = 8;

export function ChannelHandles({ ports }: { ports: FlowPort[] }) {
  const inputs = ports.filter((port) => port.direction === "in");
  const outputs = ports.filter((port) => port.direction === "out");

  return (
    <div className="mt-1.5 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
      <PortColumn
        ports={inputs}
        position={Position.Left}
        type="target"
        align="start"
      />
      <PortColumn
        ports={outputs}
        position={Position.Right}
        type="source"
        align="end"
      />
    </div>
  );
}

function PortColumn({
  ports,
  position,
  type,
  align,
}: {
  ports: FlowPort[];
  position: Position;
  type: "source" | "target";
  align: "start" | "end";
}) {
  if (ports.length === 0) return <div />;

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        align === "end" && "items-end",
        ports.length > SCROLL_AFTER && "max-h-36 overflow-y-auto pr-0.5",
      )}
    >
      {ports.map((port) => (
        <div
          key={port.id}
          className={cn(
            "flex min-w-0 items-center gap-1",
            align === "end" && "flex-row-reverse",
          )}
        >
          <Handle
            id={port.id}
            type={type}
            position={position}
            style={{ position: "static", transform: "none" }}
            className="size-2 shrink-0"
          />
          <span className="truncate">{port.label}</span>
        </div>
      ))}
    </div>
  );
}

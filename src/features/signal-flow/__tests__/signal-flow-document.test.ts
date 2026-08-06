// src/features/signal-flow/__tests__/signal-flow-document.test.ts — el documento guardado y su
// hidratación. Cubre las dos trampas de la frontera: el `{}` que Prisma pone en una escena recién
// creada y la fuga de props de React Flow dentro del JSONB.

import { describe, expect, it } from "vitest";
import { speakerSpec } from "@/features/signal-flow/__tests__/fixtures/specs";
import { portsOf } from "@/features/signal-flow/model/node-ports";
import {
  catalogSnapshotKey,
  type FlowCatalogSnapshot,
  hydrateFlow,
} from "@/features/signal-flow/model/resolved-flow";
import {
  EMPTY_SIGNAL_FLOW,
  parseSignalFlow,
  type SignalFlowDocument,
} from "@/features/signal-flow/schemas/signal-flow";

const speakerDocument: SignalFlowDocument = {
  ...EMPTY_SIGNAL_FLOW,
  nodes: [
    ...EMPTY_SIGNAL_FLOW.nodes,
    {
      id: "spk1",
      position: { x: 10, y: 20 },
      data: {
        kind: "speaker",
        catalogItemId: "clx0000000000000000000000",
        levelDb: -3,
        polarityInverted: true,
        delayMs: 12,
      },
    },
  ],
};

describe("parseSignalFlow", () => {
  it("traduce el {} de una escena recién creada al documento vacío", () => {
    const parsed = parseSignalFlow({});

    expect(parsed).toEqual({ ok: true, data: EMPTY_SIGNAL_FLOW });
  });

  it("la escena nace con el nodo de simulación puesto", () => {
    expect(EMPTY_SIGNAL_FLOW.nodes).toHaveLength(1);
    expect(EMPTY_SIGNAL_FLOW.nodes[0].data.kind).toBe("simulation");
  });

  it("rechaza props de React Flow coladas en el JSONB", () => {
    const leaked = {
      ...EMPTY_SIGNAL_FLOW,
      nodes: [
        {
          ...EMPTY_SIGNAL_FLOW.nodes[0],
          selected: true,
          measured: { width: 120 },
        },
      ],
    };

    expect(parseSignalFlow(leaked).ok).toBe(false);
  });

  it("acepta un documento propio con los ajustes de escena del parlante", () => {
    expect(parseSignalFlow(speakerDocument)).toEqual({
      ok: true,
      data: speakerDocument,
    });
  });
});

describe("hydrateFlow", () => {
  const catalogItemId = "clx0000000000000000000000";

  it("cuelga el datasheet del nodo y de ahí salen sus puertos", () => {
    const spec = speakerSpec({ activePowered: true });
    const snapshot: FlowCatalogSnapshot = new Map([
      [catalogSnapshotKey("speaker", catalogItemId), { kind: "speaker", spec }],
    ]);

    const resolved = hydrateFlow(speakerDocument, snapshot);
    const speaker = resolved.nodes[1];

    expect(speaker.specStatus).toBe("resolved");
    expect(speaker.spec).toBe(spec);
    // Caja activa: su entrada acepta línea, no potencia.
    expect(portsOf(speaker).find((port) => port.id === "in")?.domain).toBe(
      "line",
    );
  });

  it("una referencia que ya no está en el catálogo se marca, no revienta", () => {
    const resolved = hydrateFlow(speakerDocument, new Map());

    expect(resolved.nodes[1].specStatus).toBe("item_missing");
    expect(portsOf(resolved.nodes[1])).toEqual([]);
  });

  it("un datasheet de versión desconocida no se confunde con uno borrado", () => {
    const snapshot: FlowCatalogSnapshot = new Map([
      [catalogSnapshotKey("speaker", catalogItemId), { kind: "unsupported" }],
    ]);

    expect(hydrateFlow(speakerDocument, snapshot).nodes[1].specStatus).toBe(
      "unsupported_version",
    );
  });
});

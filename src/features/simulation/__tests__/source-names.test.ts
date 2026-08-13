// src/features/simulation/__tests__/source-names.test.ts — el id del nodo se lee como equipo.
//
// El caso que importa es el par estéreo: dos filas del MISMO modelo de catálogo. Si el desempate se
// rompiera, las dos cajas se llamarían igual y "reorienta esta" dejaría de señalar a ninguna.

import { describe, expect, it } from "vitest";
import {
  humaniseSourceIds,
  nameSources,
  speakerIdOf,
} from "@/features/simulation/model/source-names";

const CATALOG = new Map([
  ["spk_jbl", "JBL Charge 4"],
  ["spk_prx", "JBL PRX418S"],
]);

describe("speakerIdOf", () => {
  it("extrae el id de un ref de parlante", () => {
    expect(speakerIdOf("CatalogSpeaker:spk_jbl")).toBe("spk_jbl");
  });

  it("ignora refs de otros catálogos y malformados", () => {
    expect(speakerIdOf("CatalogConsole:cns_1")).toBeNull();
    expect(speakerIdOf("CatalogSpeaker")).toBeNull();
  });
});

describe("nameSources", () => {
  it("usa marca y modelo cuando no se repite", () => {
    const names = nameSources(
      [
        { id: "node-a", catalogRef: "CatalogSpeaker:spk_jbl" },
        { id: "node-b", catalogRef: "CatalogSpeaker:spk_prx" },
      ],
      CATALOG,
    );

    expect(names.get("node-a")).toBe("JBL Charge 4");
    expect(names.get("node-b")).toBe("JBL PRX418S");
  });

  it("numera en orden de payload las cajas del mismo modelo", () => {
    const names = nameSources(
      [
        { id: "node-a", catalogRef: "CatalogSpeaker:spk_jbl" },
        { id: "node-b", catalogRef: "CatalogSpeaker:spk_jbl" },
      ],
      CATALOG,
    );

    expect(names.get("node-a")).toBe("JBL Charge 4 · caja 1");
    expect(names.get("node-b")).toBe("JBL Charge 4 · caja 2");
  });

  // Sin fila de catálogo no hay nombre, y la vista deja el id crudo antes que inventarlo.
  it("omite la fuente que no resuelve contra el catálogo", () => {
    const names = nameSources(
      [{ id: "node-a", catalogRef: "CatalogSpeaker:borrado" }],
      CATALOG,
    );

    expect(names.has("node-a")).toBe(false);
  });
});

describe("humaniseSourceIds", () => {
  it("cambia cada aparición del id por el nombre", () => {
    const names = new Map([["node-a", "JBL Charge 4"]]);
    const text = "La caja 'node-a' pide 10 dB. Baja node-a a -10 dB.";

    expect(humaniseSourceIds(text, names)).toBe(
      "La caja 'JBL Charge 4' pide 10 dB. Baja JBL Charge 4 a -10 dB.",
    );
  });

  it("deja intacto el texto que no menciona ninguna fuente", () => {
    const names = new Map([["node-a", "JBL Charge 4"]]);
    const text = "El RT60 llega a 1.63 s en 125 Hz.";

    expect(humaniseSourceIds(text, names)).toBe(text);
  });
});

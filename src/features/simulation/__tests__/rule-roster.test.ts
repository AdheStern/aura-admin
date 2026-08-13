// src/features/simulation/__tests__/rule-roster.test.ts — el veredicto de las siete comprobaciones.
//
// Lo que se protege aquí es una promesa hacia el usuario, no un formato: la vista afirma que las
// reglas listadas CORRIERON. Si el roster perdiera una regla que disparó, esa promesa pasaría a ser
// mentira en silencio — de ahí el caso de la regla desconocida.

import { describe, expect, it } from "vitest";
import type { SimulationAlert, SimulationRecommendation } from "@/contracts";
import {
  buildRuleChecks,
  type RuleCheckContext,
} from "@/features/simulation/model/rule-roster";

function recommendation(rule: string): SimulationRecommendation {
  return {
    id: `reco_${rule}`,
    rule,
    priority: 1,
    text: "da igual: el roster solo mira `rule`",
    action: { type: "noop" },
  };
}

const UNIFORMITY: SimulationAlert = {
  metric: "uniformity",
  level: "ok",
  detail: { splSigmaDb: 2.98, okMaxDb: 3, warnMaxDb: 6 },
};

function context(overrides: Partial<RuleCheckContext> = {}): RuleCheckContext {
  return {
    recommendations: [],
    alerts: [UNIFORMITY],
    scalars: { schroederHz: 118.87 },
    rtTargetS: [0.6, 1],
    summation: "complex",
    ...overrides,
  };
}

describe("buildRuleChecks", () => {
  it("lista las siete reglas aunque no haya disparado ninguna", () => {
    const checks = buildRuleChecks(context());

    expect(checks).toHaveLength(7);
    expect(checks.every((check) => !check.fired)).toBe(true);
  });

  it("marca como disparadas solo las que el motor devolvió", () => {
    const checks = buildRuleChecks(
      context({
        recommendations: [
          recommendation("HeadroomRule"),
          recommendation("ClarityRule"),
        ],
      }),
    );

    const fired = checks.filter((check) => check.fired).map((c) => c.rule);
    expect(fired).toEqual(["ClarityRule", "HeadroomRule"]);
  });

  // La cifra medida al lado del umbral es lo que distingue "no aplica" de "se quedó a 0,02 dB".
  it("pone la σ medida junto al umbral de cobertura", () => {
    const coverage = buildRuleChecks(context()).find(
      (check) => check.rule === "CoverageGapRule",
    );

    expect(coverage?.trigger).toContain("3.0 dB");
    expect(coverage?.trigger).toContain("2.98 dB");
  });

  it("cae al umbral por defecto si la alerta de uniformidad no vino", () => {
    const coverage = buildRuleChecks(context({ alerts: [] })).find(
      (check) => check.rule === "CoverageGapRule",
    );

    expect(coverage?.trigger).toContain("3.0 dB");
    expect(coverage?.trigger).not.toContain("Medido");
  });

  // El preset simple suma en energía, y ahí la regla no puede disparar por mucho que se añadan
  // cajas: sin ese aviso, el panel mandaría a montar una segunda para nada.
  it("avisa de que la suma en energía deja muda la regla de polaridad", () => {
    const polarity = buildRuleChecks(context({ summation: "energy" })).find(
      (check) => check.rule === "PolarityRule",
    );

    expect(polarity?.trigger).toContain("suma compleja");
  });

  it("no menciona la suma cuando la corrida ya fue compleja", () => {
    const polarity = buildRuleChecks(context()).find(
      (check) => check.rule === "PolarityRule",
    );

    expect(polarity?.trigger).not.toContain("suma compleja");
  });

  it("explica el silencio del RT60 cuando nadie eligió objetivo", () => {
    const rt = buildRuleChecks(context({ rtTargetS: null })).find(
      (check) => check.rule === "RtTargetRule",
    );

    expect(rt?.trigger).toContain("Sin objetivo elegido");
  });

  it("nunca pierde una regla que disparó y no está en el roster", () => {
    const checks = buildRuleChecks(
      context({ recommendations: [recommendation("FutureRule")] }),
    );

    const extra = checks.find((check) => check.rule === "FutureRule");
    expect(extra).toEqual({
      rule: "FutureRule",
      label: "FutureRule",
      trigger: "",
      fired: true,
    });
  });
});

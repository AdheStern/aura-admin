// src/features/simulation/model/source-names.ts — de qué caja habla cada recomendación.
//
// El motor identifica las cajas por el id del nodo del grafo y no puede hacer otra cosa: es una
// función pura que recibe ids y datasheets, nunca supo que eso se llama "JBL Charge 4". El propio
// contrato lo dice en `catalogRef` — "El motor no lo resuelve" —, así que traducirlo es de esta app,
// que es la dueña del catálogo.
//
// Dos cajas del mismo modelo son el caso NORMAL, no la excepción: un par estéreo son dos filas
// idénticas de catálogo. Marca y modelo no las distinguen, así que cuando el modelo se repite se
// numeran en el orden en que viajaron en el payload. Sin ese desempate, "JBL Charge 4" señalaría a
// las dos y la recomendación de reorientar una sería inseguible.

/** id del nodo → nombre legible. Ausente = esa fuente no se pudo resolver contra el catálogo. */
export type SourceNames = Map<string, string>;

export type NamedSource = { id: string; catalogRef: string };

/** "CatalogSpeaker:clx…" → "clx…". null si el ref apunta a otro catálogo o viene malformado. */
export function speakerIdOf(catalogRef: string): string | null {
  const [kind, id] = catalogRef.split(":");
  return kind === "CatalogSpeaker" && id ? id : null;
}

export function nameSources(
  sources: readonly NamedSource[],
  modelById: ReadonlyMap<string, string>,
): SourceNames {
  const resolved = sources.map((source) => ({
    id: source.id,
    model: modelOf(source, modelById),
  }));

  const repeated = countByModel(resolved);
  const used = new Map<string, number>();
  const names: SourceNames = new Map();

  for (const { id, model } of resolved) {
    if (!model) continue;

    if ((repeated.get(model) ?? 0) < 2) {
      names.set(id, model);
      continue;
    }
    const ordinal = (used.get(model) ?? 0) + 1;
    used.set(model, ordinal);
    names.set(id, `${model} · caja ${ordinal}`);
  }

  return names;
}

/**
 * Cambia los ids crudos del texto por el nombre de la caja.
 *
 * Sobre el `text` ya redactado y no sobre los hechos: el motor interpola el id en su plantilla, y
 * cuando hay LLM lo interpola igual porque es el único identificador que recibe. Arreglarlo en el
 * origen exigiría que el payload llevara nombres, que es justo lo que ADR-02 no quiere.
 */
export function humaniseSourceIds(text: string, names: SourceNames): string {
  let result = text;
  for (const [id, name] of names) {
    result = result.split(id).join(name);
  }
  return result;
}

function modelOf(
  source: NamedSource,
  modelById: ReadonlyMap<string, string>,
): string | null {
  const speakerId = speakerIdOf(source.catalogRef);
  return speakerId ? (modelById.get(speakerId) ?? null) : null;
}

function countByModel(
  resolved: readonly { model: string | null }[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { model } of resolved) {
    if (model) counts.set(model, (counts.get(model) ?? 0) + 1);
  }
  return counts;
}

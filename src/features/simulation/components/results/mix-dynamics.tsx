// src/features/simulation/components/results/mix-dynamics.tsx — reverb y compresión de un canal.
//
// La compresión no estaba en el MVP y es la mitad de lo que un operador espera de un channel strip:
// sin ella la pantalla dice cómo suena el instrumento pero no cómo se comporta cuando el músico
// aprieta.
//
// Los valores en monoespaciada y tabulares: son cifras que se van a teclear en un equipo, y en
// proporcional bailan de línea a línea y cuesta compararlas entre canales.

import type {
  MixCompression,
  MixReverb,
} from "@/features/simulation/schemas/mix-advice";

export function MixDynamics({
  reverb,
  compression,
}: {
  reverb: MixReverb;
  compression: MixCompression;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Block
        title="Reverb"
        tag={reverb.type}
        values={[
          ["Tiempo", `${reverb.timeMs} ms`],
          ["Pre-delay", `${reverb.preDelayMs} ms`],
          ["Mezcla", `${reverb.mixPercent} %`],
        ]}
        description={reverb.description}
      />
      <Block
        title="Compresión"
        tag={`${compression.ratio}:1`}
        values={[
          ["Umbral", `${compression.thresholdDb} dB`],
          ["Ataque", `${compression.attackMs} ms`],
          ["Release", `${compression.releaseMs} ms`],
          ["Makeup", `${compression.makeupGainDb} dB`],
        ]}
        description={compression.description}
      />
    </div>
  );
}

function Block({
  title,
  tag,
  values,
  description,
}: {
  title: string;
  tag: string;
  values: [string, string][];
  description: string;
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium">{title}</span>
        <span className="font-mono text-xs uppercase text-muted-foreground">
          {tag}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
        {values.map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-2"
          >
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-mono text-xs tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-2 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

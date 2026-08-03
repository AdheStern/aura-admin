// src/features/catalogs/components/spec-datasheet.tsx — presentación común del datasheet.
// Cada tipo aporta sus filas ya formateadas (etiqueta + valor con su unidad); aquí solo se pintan.

export function SpecDatasheet({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
      {rows.map(([label, value]) => (
        <div className="contents" key={label}>
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-sm font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

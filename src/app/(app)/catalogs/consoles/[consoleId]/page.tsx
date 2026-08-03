// src/app/(app)/catalogs/consoles/[consoleId]/page.tsx

import { notFound } from "next/navigation";
import { deleteConsole } from "@/features/catalogs/actions";
import { ConsoleDatasheet } from "@/features/catalogs/components/console-datasheet";
import { DeleteCatalogAlert } from "@/features/catalogs/components/delete-catalog-alert";
import { EditConsoleDialog } from "@/features/catalogs/components/edit-console-dialog";
import { VerifiedBadge } from "@/features/catalogs/components/verified-badge";
import { getConsole } from "@/features/catalogs/queries";

export default async function ConsoleDetailPage({
  params,
}: {
  params: Promise<{ consoleId: string }>;
}) {
  const { consoleId } = await params;
  const item = await getConsole(consoleId);
  if (!item) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {item.brand} {item.model}
          </h1>
          <VerifiedBadge verified={item.verified} />
        </div>
        <div className="flex items-center gap-2">
          <EditConsoleDialog
            consoleId={item.id}
            brand={item.brand}
            model={item.model}
            specJson={JSON.stringify(item.specRaw, null, 2)}
            initialVerified={item.verified}
          />
          <DeleteCatalogAlert
            itemId={item.id}
            itemLabel={`${item.brand} ${item.model}`}
            onDelete={deleteConsole}
            redirectTo="/catalogs/consoles"
          />
        </div>
      </div>

      {item.spec ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-medium">Datasheet</h2>
          <ConsoleDatasheet spec={item.spec} />
        </section>
      ) : (
        <p className="text-sm text-destructive">
          No se pudo interpretar el datasheet (versión de spec no soportada:{" "}
          {item.specVersion}
          ). Edítalo para corregirlo.
        </p>
      )}
    </div>
  );
}

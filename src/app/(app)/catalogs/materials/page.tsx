// src/app/(app)/catalogs/materials/page.tsx

import { CreateMaterialDialog } from "@/features/catalogs/components/create-material-dialog";
import { MaterialCategoryFilter } from "@/features/catalogs/components/material-category-filter";
import { MaterialTable } from "@/features/catalogs/components/material-table";
import {
  listMaterialCategories,
  listMaterials,
} from "@/features/catalogs/queries";

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [materials, categories] = await Promise.all([
    listMaterials(category),
    listMaterialCategories(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Materiales
          </h1>
          <p className="text-sm text-muted-foreground">
            Coeficientes de absorción y dispersión por banda de octava.
          </p>
        </div>
        <CreateMaterialDialog />
      </div>
      <MaterialCategoryFilter categories={categories} />
      <MaterialTable materials={materials} />
    </div>
  );
}

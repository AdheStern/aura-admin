-- CreateTable
CREATE TABLE "catalog_source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "spec" JSONB NOT NULL,
    "specVersion" TEXT NOT NULL DEFAULT '1',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_source_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "catalog_source_category_idx" ON "catalog_source"("category");

-- CreateIndex
CREATE INDEX "catalog_source_spec_idx" ON "catalog_source" USING GIN ("spec" jsonb_path_ops);

-- CreateIndex
CREATE UNIQUE INDEX "catalog_source_name_key" ON "catalog_source"("name");

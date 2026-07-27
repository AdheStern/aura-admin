-- CreateTable
CREATE TABLE "catalog_speaker" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "spec" JSONB NOT NULL,
    "specVersion" TEXT NOT NULL DEFAULT '1',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_speaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "spec" JSONB NOT NULL,
    "specVersion" TEXT NOT NULL DEFAULT '1',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_material_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "catalog_speaker_category_idx" ON "catalog_speaker"("category");

-- CreateIndex
CREATE INDEX "catalog_speaker_spec_idx" ON "catalog_speaker" USING GIN ("spec" jsonb_path_ops);

-- CreateIndex
CREATE UNIQUE INDEX "catalog_speaker_brand_model_key" ON "catalog_speaker"("brand", "model");

-- CreateIndex
CREATE INDEX "catalog_material_category_idx" ON "catalog_material"("category");

-- CreateIndex
CREATE INDEX "catalog_material_name_idx" ON "catalog_material"("name");

-- CreateIndex
CREATE INDEX "catalog_material_spec_idx" ON "catalog_material" USING GIN ("spec" jsonb_path_ops);

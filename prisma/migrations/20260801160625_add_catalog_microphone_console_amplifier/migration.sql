-- CreateTable
CREATE TABLE "catalog_microphone" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "spec" JSONB NOT NULL,
    "specVersion" TEXT NOT NULL DEFAULT '1',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_microphone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_console" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "spec" JSONB NOT NULL,
    "specVersion" TEXT NOT NULL DEFAULT '1',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_console_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_amplifier" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "spec" JSONB NOT NULL,
    "specVersion" TEXT NOT NULL DEFAULT '1',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_amplifier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "catalog_microphone_category_idx" ON "catalog_microphone"("category");

-- CreateIndex
CREATE INDEX "catalog_microphone_spec_idx" ON "catalog_microphone" USING GIN ("spec" jsonb_path_ops);

-- CreateIndex
CREATE UNIQUE INDEX "catalog_microphone_brand_model_key" ON "catalog_microphone"("brand", "model");

-- CreateIndex
CREATE INDEX "catalog_console_category_idx" ON "catalog_console"("category");

-- CreateIndex
CREATE INDEX "catalog_console_spec_idx" ON "catalog_console" USING GIN ("spec" jsonb_path_ops);

-- CreateIndex
CREATE UNIQUE INDEX "catalog_console_brand_model_key" ON "catalog_console"("brand", "model");

-- CreateIndex
CREATE INDEX "catalog_amplifier_category_idx" ON "catalog_amplifier"("category");

-- CreateIndex
CREATE INDEX "catalog_amplifier_spec_idx" ON "catalog_amplifier" USING GIN ("spec" jsonb_path_ops);

-- CreateIndex
CREATE UNIQUE INDEX "catalog_amplifier_brand_model_key" ON "catalog_amplifier"("brand", "model");

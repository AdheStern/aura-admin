-- CreateTable
CREATE TABLE "simulation" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "request" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulation_job" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "error" JSONB,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulation_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sim_result" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "summary" JSONB,
    "payload" JSONB,
    "storagePath" TEXT,

    CONSTRAINT "sim_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "simulation_sceneId_idx" ON "simulation"("sceneId");

-- CreateIndex
CREATE UNIQUE INDEX "simulation_job_simulationId_key" ON "simulation_job"("simulationId");

-- CreateIndex
CREATE INDEX "simulation_job_status_idx" ON "simulation_job"("status");

-- CreateIndex
CREATE INDEX "sim_result_simulationId_kind_idx" ON "sim_result"("simulationId", "kind");

-- AddForeignKey
ALTER TABLE "simulation" ADD CONSTRAINT "simulation_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation" ADD CONSTRAINT "simulation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_job" ADD CONSTRAINT "simulation_job_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "simulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sim_result" ADD CONSTRAINT "sim_result_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "simulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

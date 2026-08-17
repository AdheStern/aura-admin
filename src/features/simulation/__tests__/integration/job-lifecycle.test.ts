// src/features/simulation/__tests__/integration/job-lifecycle.test.ts — la máquina de estados de la
// Sección 08 contra Postgres.
//
// Estas reglas son casi todas `updateMany` con un `where` condicionado: "solo si el job sigue vivo",
// "solo si la escena está en ROOM_READY". Esa condición ES la regla, y solo se puede comprobar
// ejecutándola contra una base — un mock devolvería lo que le pidamos y no probaría nada.

import { afterAll, expect, it } from "vitest";
import { simulationResultSchema } from "@/contracts";
import canonExpected from "@/contracts/fixtures/canon-01.expected.json";
import { expireStaleJobs } from "@/features/simulation/queries/expire-stale-jobs";
import { recordJobCancelled } from "@/features/simulation/queries/record-job-cancelled";
import { recordJobOutcome } from "@/features/simulation/queries/record-job-outcome";
import { db } from "@/lib/db";
import {
  cleanUp,
  describeIntegration,
  makeProject,
  makeQueuedJob,
  makeScene,
  makeUser,
} from "@/test/integration";

const RESULT = simulationResultSchema.parse(canonExpected);
const created: string[] = [];

/** Un usuario con proyecto, escena en el estado pedido y un job en QUEUED. */
async function scenario(status: "ROOM_READY" | "FLOW_READY" | "SIMULATED") {
  const userId = await makeUser();
  created.push(userId);
  const projectId = await makeProject(userId);
  const sceneId = await makeScene(projectId, status);
  const job = await makeQueuedJob(sceneId, userId);

  return { userId, sceneId, ...job };
}

const jobStatus = (jobId: string) =>
  db.simulationJob
    .findUnique({ where: { id: jobId }, select: { status: true } })
    .then((job) => job?.status);

const sceneStatus = (sceneId: string) =>
  db.scene
    .findUnique({ where: { id: sceneId }, select: { status: true } })
    .then((scene) => scene?.status);

afterAll(async () => {
  await cleanUp(created);
});

describeIntegration("recordJobOutcome", () => {
  it("un resultado desde QUEUED completa el job y asciende la escena", async () => {
    const { jobId, sceneId, simulationId } = await scenario("ROOM_READY");

    // Desde QUEUED y no solo desde RUNNING: un GEOMETRY_INVALID temprano llega antes del primer
    // latido, y exigir RUNNING perdería justo esos.
    expect(await recordJobOutcome(jobId, { result: RESULT })).toBe("applied");

    expect(await jobStatus(jobId)).toBe("COMPLETED");
    expect(await sceneStatus(sceneId)).toBe("SIMULATED");
    expect(
      await db.simResult.count({ where: { simulationId } }),
    ).toBeGreaterThan(0);
  });

  it("repetir el callback no duplica resultados", async () => {
    const { jobId, simulationId } = await scenario("ROOM_READY");
    await recordJobOutcome(jobId, { result: RESULT });
    const rows = await db.simResult.count({ where: { simulationId } });

    // El motor reintenta hasta tres veces; si el primer intento se entregó pero su 200 se perdió,
    // el segundo llega igual. Tiene que ser inocuo.
    expect(await recordJobOutcome(jobId, { result: RESULT })).toBe(
      "already_finished",
    );
    expect(await db.simResult.count({ where: { simulationId } })).toBe(rows);
  });

  it("no reasciende una escena que ya se editó", async () => {
    const { jobId, sceneId } = await scenario("FLOW_READY");

    // El resultado se guarda igual —sigue siendo válido para el recinto de entonces— pero la
    // escena no vuelve a SIMULATED: el usuario rompió la geometría después de encolar.
    expect(await recordJobOutcome(jobId, { result: RESULT })).toBe("applied");
    expect(await jobStatus(jobId)).toBe("COMPLETED");
    expect(await sceneStatus(sceneId)).toBe("FLOW_READY");
  });

  it("un error guarda código y detalles, y deja la escena donde estaba", async () => {
    const { jobId, sceneId } = await scenario("ROOM_READY");

    expect(
      await recordJobOutcome(jobId, {
        error: {
          code: "GEOMETRY_INVALID",
          message: "polígono abierto",
          details: { surface: "wall_2" },
        },
      }),
    ).toBe("applied");

    const job = await db.simulationJob.findUnique({
      where: { id: jobId },
      select: { status: true, error: true, finishedAt: true },
    });
    expect(job?.status).toBe("FAILED");
    expect(job?.error).toMatchObject({
      code: "GEOMETRY_INVALID",
      details: { surface: "wall_2" },
    });
    expect(job?.finishedAt).not.toBeNull();
    expect(await sceneStatus(sceneId)).toBe("ROOM_READY");
  });

  it("un job que no existe se distingue de uno ya cerrado", async () => {
    expect(
      await recordJobOutcome("00000000-0000-0000-0000-000000000000", {
        result: RESULT,
      }),
    ).toBe("unknown_job");
  });
});

describeIntegration("recordJobCancelled", () => {
  it("cierra un job vivo", async () => {
    const { jobId } = await scenario("ROOM_READY");

    expect(await recordJobCancelled(jobId)).toBe("cancelled");
    expect(await jobStatus(jobId)).toBe("CANCELLED");
  });

  it("no pisa un resultado que ya había llegado", async () => {
    const { jobId } = await scenario("ROOM_READY");
    await recordJobOutcome(jobId, { result: RESULT });

    // Cancelar después de completar tiraría un cálculo bueno que el usuario puede mirar igual.
    expect(await recordJobCancelled(jobId)).toBe("already_finished");
    expect(await jobStatus(jobId)).toBe("COMPLETED");
  });
});

describeIntegration("expireStaleJobs", () => {
  it("mata lo que lleva 10 minutos sin latir y respeta lo reciente", async () => {
    const viejo = await scenario("ROOM_READY");
    const nuevo = await scenario("ROOM_READY");

    // `updatedAt` lleva @updatedAt, así que no se puede fijar al crear: se corre el reloj del cron
    // hacia delante, que es lo mismo que espera el corte y no depende de escribir la columna.
    const enOnceMinutos = new Date(Date.now() + 11 * 60 * 1000);
    expect(await expireStaleJobs(enOnceMinutos)).toBeGreaterThanOrEqual(2);

    expect(await jobStatus(viejo.jobId)).toBe("FAILED");
    expect(await jobStatus(nuevo.jobId)).toBe("FAILED");

    const job = await db.simulationJob.findUnique({
      where: { id: viejo.jobId },
      select: { error: true },
    });
    expect(job?.error).toMatchObject({ code: "TIMEOUT" });
  });

  it("no toca un job ya terminado", async () => {
    const { jobId } = await scenario("ROOM_READY");
    await recordJobOutcome(jobId, { result: RESULT });

    await expireStaleJobs(new Date(Date.now() + 11 * 60 * 1000));
    expect(await jobStatus(jobId)).toBe("COMPLETED");
  });
});

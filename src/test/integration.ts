// src/test/integration.ts — utilidades de la capa de integración de la Sección 11 ("actions contra
// Postgres efímero — authz por rol, transiciones de estado").
//
// Las fixtures se crean con ids propios y se borran por el usuario dueño: todo cuelga de `User` con
// onDelete: Cascade, así que borrar los usuarios se lleva proyectos, escenas, simulaciones y jobs
// sin tener que recordar el orden.

import { randomUUID } from "node:crypto";
import { describe } from "vitest";
import type { SceneStatus } from "@/features/scenes/schemas";
import { db } from "@/lib/db";

/**
 * Se salta la suite entera —visiblemente, no en silencio— si no hay base de pruebas.
 *
 * En CI, TEST_DATABASE_URL apunta al Postgres efímero que levanta el workflow. En local hay que
 * dárselo a mano, y nunca la base de desarrollo: estos tests escriben y borran.
 */
export const describeIntegration = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;

export async function makeUser(platformRole?: string): Promise<string> {
  const id = randomUUID();
  await db.user.create({
    data: {
      id,
      name: "Integración",
      email: `${id}@test.local`,
      role: platformRole,
    },
  });
  return id;
}

export async function makeProject(ownerId: string): Promise<string> {
  const project = await db.project.create({
    data: { name: "Proyecto de integración", ownerId },
    select: { id: true },
  });
  return project.id;
}

export async function addMember(
  projectId: string,
  userId: string,
  role: string,
): Promise<void> {
  await db.projectMember.create({ data: { projectId, userId, role } });
}

export async function makeScene(
  projectId: string,
  status: SceneStatus,
): Promise<string> {
  const scene = await db.scene.create({
    data: { projectId, name: "Escena de integración", status },
    select: { id: true },
  });
  return scene.id;
}

/** Una simulación con su job en QUEUED, que es como los deja enqueueSimulation. */
export async function makeQueuedJob(
  sceneId: string,
  createdById: string,
): Promise<{ simulationId: string; jobId: string }> {
  const simulationId = randomUUID();
  const jobId = randomUUID();

  await db.simulation.create({
    data: {
      id: simulationId,
      sceneId,
      createdById,
      requestHash: `hash-${simulationId}`,
      config: {},
      request: {},
      job: { create: { id: jobId } },
    },
  });

  return { simulationId, jobId };
}

export async function cleanUp(userIds: string[]): Promise<void> {
  await db.user.deleteMany({ where: { id: { in: userIds } } });
}

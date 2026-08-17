// src/features/projects/__tests__/integration/project-access.test.ts — la authz de proyectos contra
// Postgres, que es lo que la Sección 11 pide como capa de integración.
//
// La tabla de precedencia ya está cubierta pura en derive-project-role. Lo que NO se puede probar
// sin base es lo de aquí: que los `select` anidados de resolveProjectAccess encuentren la membresía
// donde está. Un `where` mal puesto en esa consulta devolvería "sin acceso" para un miembro real —o
// peor, acceso para quien no lo es— y ningún test puro lo vería.

import { afterAll, expect, it } from "vitest";
import { requireProjectRole } from "@/features/projects/queries/require-project-role";
import { resolveProjectAccess } from "@/features/projects/queries/resolve-project-access";
import {
  addMember,
  cleanUp,
  describeIntegration,
  makeProject,
  makeUser,
} from "@/test/integration";

const created: string[] = [];

async function user(platformRole?: string): Promise<string> {
  const id = await makeUser(platformRole);
  created.push(id);
  return id;
}

afterAll(async () => {
  await cleanUp(created);
});

describeIntegration("resolveProjectAccess", () => {
  it("el dueño es OWNER aunque no figure en members", async () => {
    const ownerId = await user();
    const projectId = await makeProject(ownerId);

    expect(await resolveProjectAccess(ownerId, projectId)).toEqual({
      role: "OWNER",
    });
  });

  it("un miembro recibe el rol de su fila", async () => {
    const ownerId = await user();
    const editorId = await user();
    const viewerId = await user();
    const projectId = await makeProject(ownerId);
    await addMember(projectId, editorId, "EDITOR");
    await addMember(projectId, viewerId, "VIEWER");

    expect(await resolveProjectAccess(editorId, projectId)).toEqual({
      role: "EDITOR",
    });
    expect(await resolveProjectAccess(viewerId, projectId)).toEqual({
      role: "VIEWER",
    });
  });

  it("quien no es nada no tiene acceso", async () => {
    const ownerId = await user();
    const strangerId = await user();
    const projectId = await makeProject(ownerId);

    expect(await resolveProjectAccess(strangerId, projectId)).toBeNull();
  });

  it("la membresía de OTRO proyecto no da acceso a este", async () => {
    const ownerId = await user();
    const outsiderId = await user();
    const mine = await makeProject(ownerId);
    const otro = await makeProject(ownerId);
    await addMember(otro, outsiderId, "EDITOR");

    // El `where: { userId }` del select anidado es justo lo que separa estos dos casos.
    expect(await resolveProjectAccess(outsiderId, otro)).toEqual({
      role: "EDITOR",
    });
    expect(await resolveProjectAccess(outsiderId, mine)).toBeNull();
  });

  it("SUPER_ADMIN entra en cualquier proyecto", async () => {
    const ownerId = await user();
    const adminId = await user("SUPER_ADMIN");
    const projectId = await makeProject(ownerId);

    expect(await resolveProjectAccess(adminId, projectId)).toEqual({
      role: "OWNER",
    });
  });

  it("un proyecto que no existe no tiene acceso, no revienta", async () => {
    const someoneId = await user();

    expect(
      await resolveProjectAccess(someoneId, "cmproyectoquenoexiste0000"),
    ).toBeNull();
  });
});

describeIntegration("requireProjectRole", () => {
  it("un VIEWER no puede lo que es de OWNER/EDITOR", async () => {
    const ownerId = await user();
    const viewerId = await user();
    const projectId = await makeProject(ownerId);
    await addMember(projectId, viewerId, "VIEWER");

    const denied = await requireProjectRole(viewerId, projectId, [
      "OWNER",
      "EDITOR",
    ]);
    expect(denied).toEqual({
      ok: false,
      error: { code: "FORBIDDEN", message: expect.any(String) },
    });

    // Y sí puede lo que sí es suyo.
    expect(
      await requireProjectRole(viewerId, projectId, [
        "OWNER",
        "EDITOR",
        "VIEWER",
      ]),
    ).toEqual({ ok: true, role: "VIEWER" });
  });

  it("a quien no tiene acceso se le dice NOT_FOUND, no FORBIDDEN", async () => {
    const ownerId = await user();
    const strangerId = await user();
    const projectId = await makeProject(ownerId);

    // Distinguirlos le confirmaría a un extraño que ese proyecto existe.
    const result = await requireProjectRole(strangerId, projectId, ["VIEWER"]);
    expect(result).toEqual({
      ok: false,
      error: { code: "NOT_FOUND", message: expect.any(String) },
    });
  });
});

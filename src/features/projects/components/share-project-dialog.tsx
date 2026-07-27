// src/features/projects/components/share-project-dialog.tsx

"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { shareProject } from "@/features/projects/actions";
import { shareProjectSchema } from "@/features/projects/schemas/share-project";

type DialogState = { error: string | null };
type ShareRole = "EDITOR" | "VIEWER";

export function ShareProjectDialog({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<ShareRole>("VIEWER");

  const [state, action, isPending] = useActionState<DialogState, FormData>(
    async (_prevState, formData) => {
      const parsed = shareProjectSchema.safeParse({
        projectId,
        email: formData.get("email"),
        role,
      });
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
      }

      const result = await shareProject(
        parsed.data.projectId,
        parsed.data.email,
        parsed.data.role,
      );
      if (!result.ok) {
        return { error: result.error.message };
      }

      setOpen(false);
      router.refresh();
      return { error: null };
    },
    { error: null },
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        Compartir
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartir proyecto</DialogTitle>
          <DialogDescription>
            Invita a alguien que ya tenga cuenta en AURA — recibe acceso de
            inmediato.
          </DialogDescription>
        </DialogHeader>
        <form
          id="share-project-form"
          action={action}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as ShareRole)}
            >
              <SelectTrigger id="role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EDITOR">Editor</SelectItem>
                <SelectItem value="VIEWER">Lector</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </form>
        <DialogFooter>
          <Button type="submit" form="share-project-form" disabled={isPending}>
            {isPending ? "Compartiendo…" : "Compartir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

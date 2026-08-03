// src/features/catalogs/components/catalog-dialog.tsx — shell de los diálogos de alta y edición
// de catálogo. Es dueño del ciclo completo (abrir, useActionState, cerrar al éxito, refrescar) y
// del scroll: el textarea del datasheet desborda la ventana y sin max-h el botón de guardar queda
// fuera de la pantalla. Cada tipo solo aporta su adaptador a la action y sus campos.

"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DialogState = { error: string | null };

export function CatalogDialog({
  triggerLabel,
  triggerVariant = "default",
  title,
  formId,
  submitLabel,
  pendingLabel,
  onSubmit,
  children,
}: {
  triggerLabel: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  title: string;
  formId: string;
  submitLabel: string;
  pendingLabel: string;
  onSubmit: (
    formData: FormData,
  ) => Promise<{ ok: true } | { ok: false; error: { message: string } }>;
  children: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [state, action, isPending] = useActionState<DialogState, FormData>(
    async (_prevState, formData) => {
      const result = await onSubmit(formData);
      if (!result.ok) return { error: result.error.message };

      setOpen(false);
      router.refresh();
      return { error: null };
    },
    { error: null },
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={triggerVariant} />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form id={formId} action={action} className="flex flex-col gap-4">
          {children}
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </form>
        <DialogFooter>
          <Button type="submit" form={formId} disabled={isPending}>
            {isPending ? pendingLabel : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

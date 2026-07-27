// src/features/auth/components/register-form.tsx — formulario de registro (email/pass) contra Better Auth
"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpAction } from "@/features/auth/actions";
import { GoogleButton } from "@/features/auth/components/google-button";
import { signUpSchema } from "@/features/auth/schemas";

type RegisterFormState = { error: string | null };

export function RegisterForm() {
  const router = useRouter();

  const [state, action, isPending] = useActionState<
    RegisterFormState,
    FormData
  >(
    async (_prevState, formData) => {
      const parsed = signUpSchema.safeParse({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
      });
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
      }

      const result = await signUpAction(
        parsed.data.email,
        parsed.data.password,
        parsed.data.name,
      );
      if (!result.success) {
        return { error: result.message };
      }

      router.push("/projects");
      router.refresh();
      return { error: null };
    },
    { error: null },
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" type="text" autoComplete="name" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
      <div className="relative text-center text-sm text-muted-foreground before:absolute before:inset-y-1/2 before:left-0 before:h-px before:w-full before:bg-border">
        <span className="relative bg-background px-2">o</span>
      </div>
      <GoogleButton />
    </form>
  );
}

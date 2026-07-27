// src/features/auth/components/google-button.tsx — botón de acceso con Google (Better Auth)
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

export function GoogleButton() {
  const [isPending, setIsPending] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={isPending}
      onClick={async () => {
        setIsPending(true);
        await signIn.social({ provider: "google", callbackURL: "/" });
      }}
    >
      {isPending ? "Redirigiendo…" : "Continuar con Google"}
    </Button>
  );
}

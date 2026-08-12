// src/features/auth/components/sign-out-item.tsx — cerrar sesión, como entrada del menú de usuario.

"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

export function SignOutItem() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenuItem onClick={handleSignOut}>
      <LogOutIcon />
      Cerrar sesión
    </DropdownMenuItem>
  );
}

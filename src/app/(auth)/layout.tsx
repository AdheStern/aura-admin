import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-16">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="text-center font-heading text-xl font-bold tracking-tight"
        >
          AURA
        </Link>
        {children}
      </div>
    </div>
  );
}

import Link from "next/link";
import { RecoverForm } from "@/components/app/auth/recover-form";

export default function RecuperarPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12">
      <Link
        href="/"
        className="mb-8 font-heading text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        Agenda online simple
      </Link>
      <RecoverForm />
    </div>
  );
}

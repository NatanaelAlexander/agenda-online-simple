import Link from "next/link";
import { LoginForm } from "@/components/app/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12">
      <Link
        href="/"
        className="mb-8 font-heading text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        Agenda online simple
      </Link>
      <LoginForm />
    </div>
  );
}

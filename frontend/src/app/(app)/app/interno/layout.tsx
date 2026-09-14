import { AppGuard } from "@/components/app/shell/app-guard";

export default function InternoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppGuard requiredRoles={["super_admin"]}>{children}</AppGuard>;
}

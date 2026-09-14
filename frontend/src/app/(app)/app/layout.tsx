import { AppGuard } from "@/components/app/shell/app-guard";
import { AppShell } from "@/components/app/shell/app-sidebar";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <AppGuard>
      <AppShell>{children}</AppShell>
    </AppGuard>
  );
}

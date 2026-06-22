import { AppShell } from "@/components/app/app-shell";
import { ReportsClient } from "@/components/app/reports-client";
import { requireWorkspacePageAccess } from "@/lib/server/security";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireWorkspacePageAccess("/reports");
  return (
    <AppShell>
      <ReportsClient />
    </AppShell>
  );
}

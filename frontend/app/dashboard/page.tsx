import { AppShell } from "@/components/app/app-shell";
import { DashboardClient } from "@/components/app/dashboard-client";
import { listAuditLogs, listExpenses } from "@/lib/server/db";
import { getTerminal3SessionSnapshot } from "@/lib/server/terminal3";
import { requireWorkspacePageAccess } from "@/lib/server/security";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireWorkspacePageAccess("/dashboard");
  const [expenses, auditLogs, terminal3] = await Promise.all([
    listExpenses(),
    listAuditLogs(),
    getTerminal3SessionSnapshot(),
  ]);

  return (
    <AppShell>
      <DashboardClient initialExpenses={expenses} initialAuditLogs={auditLogs} terminal3={terminal3} />
    </AppShell>
  );
}

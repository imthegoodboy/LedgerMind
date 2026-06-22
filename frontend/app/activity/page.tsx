import { AppShell } from "@/components/app/app-shell";
import { ActivityClient } from "@/components/app/activity-client";
import { listAuditLogs } from "@/lib/server/db";
import { requireWorkspacePageAccess } from "@/lib/server/security";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  await requireWorkspacePageAccess("/activity");
  const auditLogs = await listAuditLogs(100);

  return (
    <AppShell>
      <ActivityClient initialAuditLogs={auditLogs} />
    </AppShell>
  );
}

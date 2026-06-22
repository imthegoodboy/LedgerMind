import { AppShell } from "@/components/app/app-shell";
import { AgentsClient } from "@/components/app/agents-client";
import { getTerminal3SessionSnapshot } from "@/lib/server/terminal3";
import { requireWorkspacePageAccess } from "@/lib/server/security";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  await requireWorkspacePageAccess("/agents");
  const terminal3 = await getTerminal3SessionSnapshot();

  return (
    <AppShell>
      <AgentsClient initialTerminal3={terminal3} />
    </AppShell>
  );
}

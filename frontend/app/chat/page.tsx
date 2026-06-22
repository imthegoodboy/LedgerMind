import { AppShell } from "@/components/app/app-shell";
import { ChatClient } from "@/components/app/chat-client";
import { requireWorkspacePageAccess } from "@/lib/server/security";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  await requireWorkspacePageAccess("/chat");
  return (
    <AppShell>
      <ChatClient />
    </AppShell>
  );
}

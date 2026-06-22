import { AppShell } from "@/components/app/app-shell";
import { UploadClient } from "@/components/app/upload-client";
import { requireWorkspacePageAccess } from "@/lib/server/security";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  await requireWorkspacePageAccess("/upload");
  return (
    <AppShell>
      <UploadClient />
    </AppShell>
  );
}

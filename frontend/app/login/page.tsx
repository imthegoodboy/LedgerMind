import { redirect } from "next/navigation";
import { workspaceAuthEnabled, verifyWorkspaceSession } from "@/lib/server/security";
import { cookies } from "next/headers";
import { LoginClient } from "@/components/app/login-client";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/dashboard";

  if (!workspaceAuthEnabled()) {
    redirect(nextPath);
  }

  const cookieStore = await cookies();
  if (verifyWorkspaceSession(cookieStore.get("ledgermind_session")?.value)) {
    redirect(nextPath);
  }

  return <LoginClient nextPath={nextPath} />;
}

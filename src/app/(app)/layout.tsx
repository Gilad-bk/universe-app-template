import { headers } from "next/headers";
import { getAppData } from "@/lib/api";
import { ToastProvider } from "@universe-platform/ui";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OrgAuthGatekeeper } from "@/components/OrgAuthGatekeeper";
import { Navbar } from "@/components/Navbar";
import { PermissionsProvider } from "@/components/PermissionsProvider";
import { executeAction } from "@/services/universeApi";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const appData = await getAppData(host);

  if (!appData) {
    return null; // Handled by root layout
  }

  // Resolve auth session and verify membership server-side
  const { userId, getToken } = await auth();

  let initialIsMember = false;
  if (!userId) {
    redirect("/system_signin");
  } else {
    let token: string | undefined;
    let orgId: string | undefined;
    try {
      token = (await getToken()) || undefined;
      orgId = appData.organizationId || appData.organization?.orgIdentifier;
      const membershipRes = await executeAction("CHECK_MEMBERSHIP", {}, { orgId }, token);
      
      // executeAction might unwrap `.data` automatically, so we check both structures
      const roleData = membershipRes?.data || membershipRes;
      
      if (roleData && roleData.role) {
        if (!appData.organization) appData.organization = {} as any;
        appData.organization.role = roleData.role;
        
        if (!appData.user) appData.user = {} as any;
        appData.user!.systemRole = roleData.systemRole;
      }
      
      initialIsMember = true;
    } catch (err: any) {
      console.error("[AppLayout Auth Check Failed]:", {
        userId,
        hasToken: !!token,
        orgId,
        error: err
      });

      if (appData.user?.systemRole === "PLATFORM_ADMIN") {
        initialIsMember = true;
      } else {
        // Mark as unauthorized if verification fails
        initialIsMember = false;
        redirect("/system_notauthorize");
      }
    }
  }

  return (
    <PermissionsProvider role={appData.organization?.role} systemRole={appData.user?.systemRole}>
      <OrgAuthGatekeeper appData={appData} initialIsMember={initialIsMember}>
        <ToastProvider>
          <Navbar appData={appData} />
          <main className="flex-1 flex flex-col">{children}</main>
        </ToastProvider>
      </OrgAuthGatekeeper>
    </PermissionsProvider>
  );
}

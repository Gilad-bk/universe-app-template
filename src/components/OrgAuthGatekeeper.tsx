"use client";

import React, { useEffect, useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { executeAction } from "@/services/universeApi";
import type { App } from "@/lib/types";

interface OrgAuthGatekeeperProps {
  appData: App;
  initialIsMember?: boolean;
  children: React.ReactNode;
}

// Gatekeeper verifying organization membership for authenticated users
export function OrgAuthGatekeeper({
  appData,
  initialIsMember = false,
  children,
}: OrgAuthGatekeeperProps) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { signOut } = useClerk();
  const [membershipStatus, setMembershipStatus] = useState<"member" | "not_member">(
    initialIsMember ? "member" : "not_member"
  );

  useEffect(() => {
    let isCancelled = false;

    async function verifyMembership() {
      if (!isLoaded || !isSignedIn) {
        return;
      }

      try {
        const token = (await getToken()) || undefined;
        const orgId = appData.organizationId || appData.organization?.orgIdentifier;

        // Verify membership via action engine
        await executeAction(
          "CHECK_MEMBERSHIP",
          {},
          { orgId },
          token
        );

        if (!isCancelled) {
          setMembershipStatus("member");
        }
      } catch (err: any) {
        // Mark as non-member if verification fails
        if (!isCancelled) {
          setMembershipStatus("not_member");
        }
      }
    }

    verifyMembership();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken, appData.organizationId, appData.organization?.orgIdentifier]);

  // State 2: Redirect to dedicated system route on failure
  if (membershipStatus === "not_member") {
    // Avoid redirect loop if already on the page (though Gatekeeper shouldn't be rendered there)
    if (typeof window !== "undefined" && !window.location.pathname.includes("/system_notauthorize")) {
      window.location.href = "/system_notauthorize";
    }
    return null;
  }

  // State 3: Valid authorized member renders application shell
  return <>{children}</>;
}

import React from "react";
import { UserButton } from "@clerk/nextjs";

export function UserNavButton() {
  return <UserButton afterSignOutUrl="/system_signin" />;
}

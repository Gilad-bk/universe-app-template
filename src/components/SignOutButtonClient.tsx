"use client";

import React from "react";
import { SignOutButton } from "@clerk/nextjs";

export function SignOutButtonClient() {
  return (
    <SignOutButton redirectUrl="/system_signin">
      <button className="w-full py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer">
        התנתק מהחשבון
      </button>
    </SignOutButton>
  );
}

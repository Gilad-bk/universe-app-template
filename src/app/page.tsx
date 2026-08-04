"use client";

import { UNIVERSE_COMPONENTS } from "@universe-platform/ui";

export default function OrganizationWorkspacePage() {
  // Temporary integration check for UI library resolution
  console.log("UI Library Component Registry:", Object.keys(UNIVERSE_COMPONENTS));

  return (
    <div className="p-6 flex-1 text-right text-slate-800">
      <div className="bg-white p-6 rounded-md shadow-sm border border-slate-200 mb-6">
        <h1 className="text-2xl font-bold mb-2 text-slate-900">ברוכים הבאים אל מרחב העבודה של הארגון</h1>
      </div>
    </div>
  );
}
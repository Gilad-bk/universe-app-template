import { isUiLibraryReady, isUiLibraryReadyNot } from "@universe-platform/ui";


export default async function OrganizationWorkspacePage() {
  // Temporary integration check for UI library resolution
  console.log("UI Library Ready State:", isUiLibraryReady);
  console.log("UI Library Ready State Not:", isUiLibraryReadyNot);

  return (
    <div className="p-6 flex-1 text-right text-slate-800">
      <div className="bg-white p-6 rounded-md shadow-sm border border-slate-200 mb-6">
        <h1 className="text-2xl font-bold mb-2 text-slate-900">ברוכים הבאים אל מרחב העבודה של הארגון</h1>
      </div>
    </div>
  );
}
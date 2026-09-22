import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAppData } from "@/lib/api";

// Disable caching so root redirect navigates dynamically based on current configuration
export const dynamic = "force-dynamic";

export default async function OrganizationWorkspacePage() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const appData = await getAppData(host);

  if (appData && Array.isArray(appData.pages) && appData.pages.length > 0) {
    // Determine the first accessible route sorted by page order
    const sortedPages = [...appData.pages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const firstPage = sortedPages[0];
    if (firstPage && firstPage.slug) {
      redirect(`/${firstPage.slug}`);
    }
  }

  // Fallback if no pages exist in the application
  return (
    <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-700" dir="rtl">
      <p className="text-lg font-medium">לא נמצאו דפים מוגדרים באפליקציה זו.</p>
    </div>
  );
}

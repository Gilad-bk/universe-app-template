import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getAppData } from "@/lib/api";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const headersList = await headers();
  const host = headersList.get("host") ?? "";

  // Next.js memoizes identical fetch calls within the same render pass.
  const appData = await getAppData(host);

  if (!appData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center" dir="rtl">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">שגיאה בטעינת האפליקציה</h1>
        <p className="text-slate-600">לא ניתן היה לטעון את הגדרות האפליקציה או שהאפליקציה אינה קיימת.</p>
      </div>
    );
  }

  const decodedSlug = decodeURIComponent(slug);
  const page = appData.pages.find((p) => p.slug === decodedSlug);

  if (!page) {
    notFound();
  }

  return (
    <div className="w-full text-right" dir="rtl">
      <h1 className="text-3xl font-bold mb-6 text-right">{page.pageTitle}</h1>
      <div className="flex flex-col gap-6">
        {page.components?.map((component) => {
          // Dynamic component rendering 
          return null;
        })}
      </div>
    </div>
  );
}

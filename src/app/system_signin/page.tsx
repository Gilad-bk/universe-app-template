import { getAppData } from "@/lib/api";
import { headers } from "next/headers";
import { ClerkLoaded, ClerkLoading, SignIn } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default async function SystemSignInPage() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const appData = await getAppData(host);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-panel-dark text-white p-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          {appData?.organization?.name || "Welcome"}
        </h1>
        <p className="text-slate-400">Please sign in to access this organization workspace</p>
      </div>
      <ClerkLoading>
        <div className="w-[400px] h-[500px] bg-slate-800 rounded-xl animate-pulse mx-auto"></div>
      </ClerkLoading>
      <ClerkLoaded>
        <SignIn routing="hash" />
      </ClerkLoaded>
    </div>
  );
}

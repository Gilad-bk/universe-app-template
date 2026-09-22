import { getAppData } from "@/lib/api";
import { headers } from "next/headers";
import { SignOutButton } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default async function SystemNotAuthorizePage() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const appData = await getAppData(host);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-panel-dark text-white p-6" dir="rtl">
      <div className="max-w-md w-full bg-slate-800/90 border border-slate-700 rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-3xl font-bold mb-4">
          ✕
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">אין גישה - אינך חבר בארגון זה</h1>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          אין לך הרשאות לצפות באפליקציה זו. פנה למנהל המערכת על מנת לקבל גישה לארגון {appData?.organization?.name || ""}.
        </p>
        <SignOutButton redirectUrl="/system_signin">
          <button className="w-full py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer">
            התנתק מהחשבון
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { headers } from "next/headers";
import { getAppData } from "@/lib/api";
import { ToastProvider } from "@universe-platform/ui";
import {
  ClerkProvider,
} from "@clerk/nextjs";

// Force dynamic execution for fresh authorization on each request
export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Universe Application",
  description: "Dynamic workspace powered by Universe",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const appData = await getAppData(host);

  if (!appData) {
    return (
      <ClerkProvider afterSignOutUrl="/">
        <html lang="he" dir="rtl" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
          <body className="min-h-full flex items-center justify-center bg-slate-50 text-slate-900">
            <div className="p-10 text-center text-xl">App not found</div>
          </body>
        </html>
      </ClerkProvider>
    );
  }



  return (
    <ClerkProvider afterSignOutUrl="/system_signin">
      <html
        lang="he"
        dir="rtl"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { App } from "@/lib/types";
import { UserNavButton } from "@/components/UserNavButton";
import { ExternalLink } from "lucide-react";
import { usePermissions } from "@/components/PermissionsProvider";

function OrgNavLink({ title, href, isActive }: { title: string; href: string; isActive: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className={`px-3.5 py-1.5 rounded-lg transition-all text-sm font-medium inline-block ${
          isActive
            ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-2xs"
            : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
        }`}
      >
        {title}
      </Link>
    </li>
  );
}

export function Navbar({ appData }: { appData: App }) {
  const pathname = usePathname();
  const { isOwner, isPlatformAdmin } = usePermissions();
  const sortedPages = [...appData.pages].sort((a, b) => a.order - b.order);
  const initial = appData.organization?.name ? appData.organization.name[0].toUpperCase() : "U";

  const effectiveIsOwner =
    appData.currentUserRole === "OWNER" ||
    appData.organization?.role === "OWNER" ||
    isOwner ||
    isPlatformAdmin;

  const dashboardUrl =
    process.env.NEXT_PUBLIC_DASHBOARD_URL ||
    process.env.NEXT_PUBLIC_UNIVERSE_SERVER_URL ||
    "http://localhost:3000";

  const orgId = appData.organizationId || (appData as any).organization?.id;

  return (
    <header className="h-16 bg-panel-dark text-white flex items-center justify-between px-6 border-b border-neutral-800 shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 font-bold text-xl">
          <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm shrink-0">
            {initial}
          </div>
          <span className="text-white tracking-wide font-bold">{appData.organization?.name}</span>
        </div>

        {effectiveIsOwner && orgId && (
          <a
            href={`${dashboardUrl}/organizations/${orgId}/edit-app?tab=menu`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 transition-all shadow-xs shrink-0 cursor-pointer"
            title="ערוך תפריט בלוח הבקרה"
          >
            <span>ערוך תפריט</span>
            <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
          </a>
        )}

        <nav>
          <ul className="flex items-center gap-1">
            {sortedPages.map((page) => {
              const targetHref = `/${page.slug}`;
              const decodedPathname = pathname ? decodeURIComponent(pathname) : "";
              const isActive =
                decodedPathname === targetHref ||
                decodedPathname === `/${page.slug}` ||
                pathname === targetHref ||
                pathname === encodeURI(targetHref);

              return (
                <OrgNavLink
                  key={page.id}
                  title={page.pageName}
                  href={targetHref}
                  isActive={isActive}
                />
              );
            })}
          </ul>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <UserNavButton />
      </div>
    </header>
  );
}

import Link from "next/link";
import type { App } from "@/lib/types";
import { UserNavButton } from "@/components/UserNavButton";

function OrgNavLink({ title, href }: { title: string; href: string }) {
  return (
    <li>
      <Link
        href={href}
        className="px-4 py-2 rounded-md text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium inline-block"
      >
        {title}
      </Link>
    </li>
  );
}

export function Navbar({ appData }: { appData: App }) {
  const sortedPages = [...appData.pages].sort((a, b) => a.order - b.order);
  const initial = appData.organization?.name ? appData.organization.name[0].toUpperCase() : "U";

  return (
    <header className="h-16 bg-panel-dark text-white flex items-center justify-between px-6 border-b border-neutral-800 shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 font-bold text-xl">
          <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm shrink-0">
            {initial}
          </div>
          <span className="text-white tracking-wide font-bold">{appData.organization?.name}</span>
        </div>
        <nav>
          <ul className="flex items-center gap-1">
            {sortedPages.map((page) => (
              <OrgNavLink key={page.id} title={page.pageName} href={`/${page.slug}`} />
            ))}
          </ul>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <UserNavButton />
      </div>
    </header>
  );
}

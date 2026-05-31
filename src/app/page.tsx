
function OrgSidebarLink({ title, href }: { title: string; href: string }) {
  return (
    <li>
      <a 
        href={href} 
        className="block px-4 py-2 rounded-md bg-white/5 text-brand hover:bg-white/10 transition-colors text-right"
      >
        {title}
      </a>
    </li>
  );
}

function Sidebar() {
  return (
    <aside className="w-64 bg-panel-dark text-white flex flex-col border-l border-neutral-800 shrink-0">
      <div className="h-16 flex items-center justify-end px-6 font-bold text-xl text-brand border-b border-neutral-800">
        MyAPP
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <OrgSidebarLink title="מסך הבית" href="#" />
        </ul>
      </nav>
    </aside>
  );
}

export default async function OrganizationWorkspacePage() {
  
  return (
    <div className="flex flex-row-reverse min-h-screen bg-slate-50 text-slate-900">
      
      <Sidebar />

      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-row-reverse">
          
        </header>

        <div className="p-6 flex-1 text-right text-slate-800">
          <div className="bg-white p-6 rounded-md shadow-sm border border-slate-200 mb-6">
            <h1 className="text-2xl font-bold mb-2 text-slate-900">ברוכים הבאים אל מרחב העבודה של הארגון</h1>
          </div>
        </div>
      </main>
    </div>
  );
}
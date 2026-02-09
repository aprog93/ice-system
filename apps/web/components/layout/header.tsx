"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/potencial": "Potencial",
  "/dashboard/tramites": "Trámites",
  "/dashboard/contratos": "Contratos",
  "/dashboard/reportes": "Reportes",
};

export function Header() {
  const pathname = usePathname();
  const title = breadcrumbMap[pathname] || "Sistema ICE";

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between px-8">
      <div>
        <nav className="text-sm text-slate-500 mb-1">
          <span>Inicio</span>
          <span className="mx-2">/</span>
          <span className="text-slate-800">{title}</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2.5 rounded-xl hover:bg-slate-100/50 transition-colors relative">
          <Search className="w-5 h-5 text-slate-600" />
        </button>
        <button className="p-2.5 rounded-xl hover:bg-slate-100/50 transition-colors relative">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}

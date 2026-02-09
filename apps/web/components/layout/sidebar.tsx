"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  BarChart3,
  LogOut,
  GraduationCap,
  Trash2,
  FileCheck,
  Upload,
  FileSpreadsheet,
  HelpCircle,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/potencial", label: "Potencial", icon: Users },
  { href: "/dashboard/pasaportes", label: "Pasaportes", icon: FileSpreadsheet },
  { href: "/dashboard/tramites", label: "Trámites", icon: FileText },
  { href: "/dashboard/contratos", label: "Contratos", icon: Briefcase },
  {
    href: "/dashboard/actas-extranjeria",
    label: "Actas Extranjería",
    icon: FileCheck,
  },
  {
    href: "/dashboard/tramites/importar-pasaportes",
    label: "Importar Pasaportes",
    icon: Upload,
    roles: ["ADMIN", "OPERADOR"],
  },
  { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3 },
  {
    href: "/dashboard/papelera",
    label: "Papelera",
    icon: Trash2,
    roles: ["ADMIN", "OPERADOR"],
  },
  {
    href: "/dashboard/ayuda",
    label: "Ayuda",
    icon: HelpCircle,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64">
      <div className="glass-sidebar h-full flex flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center justify-center border-b border-slate-200/50">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-800">
                Sistema ICE
              </span>
              <span className="text-xs text-slate-500">
                Cooperación Educativa
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
          <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Menú Principal
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : "text-slate-600 hover:bg-slate-100/50 hover:text-slate-900",
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-white")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info & Logout */}
        <div className="border-t border-slate-200/50 p-4">
          <div className="glass-card p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-white font-semibold">
                {user?.nombre?.[0]}
                {user?.apellidos?.[0]}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold text-slate-800 truncate">
                  {user?.nombre} {user?.apellidos}
                </span>
                <span className="text-xs text-slate-500 capitalize">
                  {user?.rol}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </aside>
  );
}

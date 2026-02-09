"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  FileText,
  Briefcase,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { profesoresService } from "@/services/profesores.service";
import { pasaportesService } from "@/services/pasaportes.service";
import { contratosService } from "@/services/contratos.service";
import { toast } from "react-hot-toast";

interface DashboardStats {
  profesores: number;
  pasaportes: number;
  contratosActivos: number;
  pasaportesPorVencer: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    profesores: 0,
    pasaportes: 0,
    contratosActivos: 0,
    pasaportesPorVencer: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);

        const [profesoresData, pasaportesData, contratosData, alertasData] =
          await Promise.all([
            profesoresService.getAll({ limit: 1 }),
            pasaportesService.getAll({ limit: 1 }),
            contratosService.getAll({ estado: "ACTIVO", limit: 1 }),
            pasaportesService.getAlertas(),
          ]);

        setStats({
          profesores: profesoresData.meta?.total || 0,
          pasaportes: pasaportesData.meta?.total || 0,
          contratosActivos: contratosData.meta?.total || 0,
          pasaportesPorVencer:
            alertasData.resumen.totalProximos30 +
            alertasData.resumen.totalVencidos,
        });
      } catch (error) {
        toast.error("Error al cargar estadísticas");
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    {
      title: "Profesores",
      subtitle: "En potencial",
      value: stats.profesores,
      icon: Users,
      gradient: "from-blue-500 to-cyan-400",
      shadowColor: "shadow-blue-500/30",
      href: "/dashboard/potencial",
    },
    {
      title: "Pasaportes",
      subtitle: "Registrados",
      value: stats.pasaportes,
      icon: FileText,
      gradient: "from-emerald-500 to-teal-400",
      shadowColor: "shadow-emerald-500/30",
      href: "/dashboard/tramites",
    },
    {
      title: "Contratos",
      subtitle: "Activos",
      value: stats.contratosActivos,
      icon: Briefcase,
      gradient: "from-purple-500 to-pink-400",
      shadowColor: "shadow-purple-500/30",
      href: "/dashboard/contratos",
    },
    {
      title: "Alertas",
      subtitle: "Por vencer",
      value: stats.pasaportesPorVencer,
      icon: AlertTriangle,
      gradient: "from-orange-500 to-red-400",
      shadowColor: "shadow-orange-500/30",
      href: "/dashboard/tramites",
      alert: stats.pasaportesPorVencer > 0,
    },
  ];

  const quickActions = [
    {
      title: "Gestionar Potencial",
      description: "Ver y gestionar profesores en potencial",
      href: "/dashboard/potencial",
      gradient: "from-blue-500/10 to-cyan-500/10",
    },
    {
      title: "Trámites de Pasaportes",
      description: "Registrar pasaportes y visas",
      href: "/dashboard/tramites",
      gradient: "from-emerald-500/10 to-teal-500/10",
    },
    {
      title: "Contratos",
      description: "Gestionar contratos y prórrogas",
      href: "/dashboard/contratos",
      gradient: "from-purple-500/10 to-pink-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Bienvenido al Sistema de Cooperación Internacional
          </p>
        </div>
        <div className="glass-badge">
          <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
          <span className="text-slate-600">Sistema Activo</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href}>
              <div className="glass-card p-6 group cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{card.subtitle}</p>
                    <h3 className="text-lg font-semibold text-slate-800 mt-1">
                      {card.title}
                    </h3>
                  </div>
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} ${card.shadowColor} shadow-lg`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-slate-800">
                    {isLoading ? (
                      <span className="text-slate-300">-</span>
                    ) : (
                      card.value
                    )}
                  </span>
                </div>
                <div className="mt-4 flex items-center text-sm text-blue-600 group-hover:text-blue-700 transition-colors">
                  <span>Ver detalles</span>
                  <ArrowUpRight className="w-4 h-4 ml-1 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Accesos Rápidos
          </h2>
          <div className="grid gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <div className="glass-card p-5 group cursor-pointer flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center`}
                    >
                      <div className="w-6 h-6 rounded-lg bg-white/90" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* System Info */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Información
          </h2>
          <div className="glass-card p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-slate-600">
                  Sistema Online
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Versión</span>
                  <span className="font-medium text-slate-700">1.0.0</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Actualizado</span>
                  <span className="font-medium text-slate-700">Feb 2025</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-500">Soporte</span>
                  <span className="font-medium text-slate-700">
                    soporte@ice.cu
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

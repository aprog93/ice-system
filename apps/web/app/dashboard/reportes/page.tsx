"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileDown,
  Users,
  FileText,
  Briefcase,
  Clock,
  Loader2,
  Filter,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { profesoresService } from "@/services/profesores.service";
import {
  contratosService,
  prorrogasService,
} from "@/services/contratos.service";
import { pasaportesService } from "@/services/pasaportes.service";
import { nomencladoresService } from "@/services/nomencladores.service";

interface Pais {
  id: string;
  nombre: string;
}

interface ReportFilter {
  fechaDesde?: string;
  fechaHasta?: string;
  paisId?: string;
  estado?: string;
}

export default function ReportesPage() {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [paises, setPaises] = useState<Pais[]>([]);
  const [filters, setFilters] = useState<ReportFilter>({});

  useEffect(() => {
    loadPaises();
  }, []);

  const loadPaises = async () => {
    try {
      const data = await nomencladoresService.getPaises();
      setPaises(data);
    } catch (error) {
      toast.error("Error al cargar países");
    }
  };

  const handleExport = async (
    type: string,
    exportFn: () => Promise<Blob>,
    filename: string,
  ) => {
    try {
      setIsLoading((prev) => ({ ...prev, [type]: true }));

      const blob = await exportFn();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Reporte descargado exitosamente");
    } catch (error) {
      toast.error("Error al generar el reporte");
      console.error(error);
    } finally {
      setIsLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const reportes = [
    {
      id: "profesores",
      title: "Profesores en Potencial",
      description:
        "Listado completo de profesores con todos sus datos personales y contacto",
      icon: Users,
      action: () =>
        handleExport(
          "profesores",
          () =>
            profesoresService.generarReportePdf({
              estadoPotencial: filters.estado as
                | "ACTIVO"
                | "EN_PROCESO"
                | "CONTRATADO"
                | "BAJA"
                | "SUSPENDIDO"
                | undefined,
            }),
          `reporte-profesores-${new Date().toISOString().split("T")[0]}.pdf`,
        ),
      filterFields: ["estado"],
    },
    {
      id: "pasaportes",
      title: "Pasaportes y Visas",
      description: "Reporte de pasaportes con fechas de vencimiento y estado",
      icon: FileText,
      action: () =>
        handleExport(
          "pasaportes",
          () =>
            pasaportesService.generarReportePdf({
              estado: filters.estado as "vencidos" | "proximos" | "vigentes",
            }),
          `reporte-pasaportes-${new Date().toISOString().split("T")[0]}.pdf`,
        ),
      filterFields: ["estado"],
    },
    {
      id: "contratos",
      title: "Contratos",
      description: "Listado de contratos con detalles de país, fechas y estado",
      icon: Briefcase,
      action: () =>
        handleExport(
          "contratos",
          () =>
            contratosService.generarReportePdf({
              paisId: filters.paisId,
              estado: filters.estado as
                | "ACTIVO"
                | "PRORROGADO"
                | "CERRADO"
                | "CANCELADO"
                | undefined,
            }),
          `reporte-contratos-${new Date().toISOString().split("T")[0]}.pdf`,
        ),
      filterFields: ["pais", "estado"],
    },
    {
      id: "prorrogas",
      title: "Prórrogas",
      description: "Historial completo de prórrogas por contrato",
      icon: Clock,
      action: () =>
        handleExport(
          "prorrogas",
          () => prorrogasService.generarReportePdf(),
          `reporte-prorrogas-${new Date().toISOString().split("T")[0]}.pdf`,
        ),
      filterFields: [],
    },
  ];

  const renderFilter = (field: string, reportId: string) => {
    const showFilter = reportes
      .find((r) => r.id === reportId)
      ?.filterFields?.includes(field);
    if (!showFilter) return null;

    switch (field) {
      case "pais":
        return (
          <div className="space-y-2" key={`${reportId}-pais`}>
            <Label className="text-xs">País</Label>
            <Select
              value={filters.paisId || "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  paisId: value === "all" ? undefined : value,
                }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Todos los países" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los países</SelectItem>
                {paises.map((pais) => (
                  <SelectItem key={pais.id} value={pais.id}>
                    {pais.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "estado":
        const options =
          reportId === "pasaportes"
            ? [
                { value: "all", label: "Todos" },
                { value: "vigentes", label: "Vigentes" },
                { value: "proximos", label: "Próximos a vencer (30 días)" },
                { value: "vencidos", label: "Vencidos" },
              ]
            : reportId === "contratos"
              ? [
                  { value: "all", label: "Todos" },
                  { value: "ACTIVO", label: "Activos" },
                  { value: "PRORROGADO", label: "Prorrogados" },
                  { value: "CERRADO", label: "Cerrados" },
                  { value: "CANCELADO", label: "Cancelados" },
                ]
              : [
                  { value: "all", label: "Todos" },
                  { value: "ACTIVO", label: "Activo" },
                  { value: "EN_PROCESO", label: "En Proceso" },
                  { value: "CONTRATADO", label: "Contratado" },
                  { value: "BAJA", label: "Baja" },
                  { value: "SUSPENDIDO", label: "Suspendido" },
                ];

        return (
          <div className="space-y-2" key={`${reportId}-estado`}>
            <Label className="text-xs">Estado</Label>
            <Select
              value={filters.estado || "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  estado: value === "all" ? undefined : value,
                }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reportes</h2>
        <p className="text-muted-foreground">
          Generación de reportes en formato PDF
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reportes.map((reporte) => {
          const Icon = reporte.icon;
          const loading = isLoading[reporte.id];

          return (
            <Card key={reporte.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start gap-4 pb-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{reporte.title}</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {reporte.description}
                  </CardDescription>
                </div>
              </CardHeader>

              {reporte.filterFields.length > 0 && (
                <CardContent className="pb-2 pt-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-500 font-medium">
                      Filtros
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {renderFilter("pais", reporte.id)}
                    {renderFilter("estado", reporte.id)}
                  </div>
                </CardContent>
              )}

              <CardContent className="pt-0 mt-auto">
                <Button
                  onClick={reporte.action}
                  variant="outline"
                  className="w-full border-red-200 hover:bg-red-50 hover:text-red-600"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4 text-red-500" />
                      Descargar PDF
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-slate-50/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Información sobre los Reportes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-slate-600">
            <p>
              <strong>Profesores:</strong> Exporta todos los datos personales de
              los profesores en potencial, incluyendo información de contacto,
              ubicación y estado actual.
            </p>
            <p>
              <strong>Pasaportes:</strong> Genera un reporte completo de
              pasaportes registrados, con fechas de expedición y vencimiento,
              número de archivo, y cantidad de visas asociadas.
            </p>
            <p>
              <strong>Contratos:</strong> Exporta el listado de contratos con
              información del profesor, país de destino, fechas de vigencia,
              función y salario.
            </p>
            <p>
              <strong>Prórrogas:</strong> Genera un historial detallado de todas
              las prórrogas realizadas, incluyendo motivo y fechas de extensión.
            </p>
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                Los reportes se descargan en formato PDF (.pdf) y pueden abrirse
                con Adobe Acrobat Reader, navegadores web u otras aplicaciones
                compatibles.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

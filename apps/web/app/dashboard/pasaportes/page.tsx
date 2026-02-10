"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pasaporte } from "@/types";
import { pasaportesService } from "@/services/pasaportes.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { NotificationService } from "@/services/notification.service";
import {
  Search,
  Plus,
  AlertTriangle,
  Eye,
  FileSpreadsheet,
  Loader2,
  Edit,
  Upload,
  FileText,
  ScrollText,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function PasaportesPage() {
  const router = useRouter();
  const [pasaportes, setPasaportes] = useState<Pasaporte[]>([]);
  const [alertas, setAlertas] = useState<{
    vencidos: Pasaporte[];
    proximos30: Pasaporte[];
  }>({ vencidos: [], proximos30: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");

  useEffect(() => {
    console.log("PasaportesPage: useEffect triggered");
    try {
      loadData();
    } catch (err) {
      console.error("PasaportesPage: Error in useEffect:", err);
      setIsLoading(false);
      setError("Error inicializando página");
    }
  }, []);

  const loadData = async () => {
    console.log("PasaportesPage: loadData started");
    try {
      setIsLoading(true);
      setError(null);

      // Fetch pasaportes and alertas with timeout
      const timeoutMs = 10000; // 10 second timeout

      console.log("PasaportesPage: Fetching data...");
      const pasaportesPromise = pasaportesService.getAll({ limit: 100 });
      const alertasPromise = pasaportesService.getAlertas();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Tiempo de espera agotado")),
          timeoutMs,
        ),
      );

      const [pasaportesData, alertasData] = (await Promise.race([
        Promise.all([pasaportesPromise, alertasPromise]),
        timeoutPromise.then(() => {
          throw new Error("Timeout");
        }),
      ])) as [any, any];

      console.log("PasaportesPage: Data received:", {
        pasaportesData,
        alertasData,
      });

      setPasaportes(pasaportesData?.data || []);
      setAlertas({
        vencidos: alertasData?.vencidos || [],
        proximos30: alertasData?.proximos30 || [],
      });
    } catch (error: any) {
      console.error("PasaportesPage: Error in loadData:", error);
      const errorMsg = error.message || "Error al cargar datos";
      setError(errorMsg);
      NotificationService.error(`Error al cargar pasaportes: ${errorMsg}`);
      // Set empty arrays to prevent undefined errors
      setPasaportes([]);
      setAlertas({ vencidos: [], proximos30: [] });
    } finally {
      console.log("PasaportesPage: loadData finished");
      setIsLoading(false);
    }
  };

  const handleDescargarX22 = async (pasaporteId: string) => {
    try {
      const loadingToast = NotificationService.loading(
        "Generando formulario X-22...",
      );
      const pdfBlob = await pasaportesService.generarFormularioX22(pasaporteId);

      // Crear URL y descargar
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `solicitud-pasaporte-X22-${pasaporteId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      NotificationService.update(
        loadingToast,
        "Formulario X-22 descargado exitosamente",
        "success",
      );
    } catch (error: any) {
      console.error("Error al generar X-22:", error);
      NotificationService.error(
        error.message || "Error al generar el formulario X-22",
      );
    }
  };

  const handleDescargarActaExtranjeria = async (pasaporteId: string) => {
    try {
      const loadingToast = NotificationService.loading(
        "Generando Acta de Extranjería...",
      );
      const pdfBlob =
        await pasaportesService.generarActaExtranjeria(pasaporteId);

      // Crear URL y descargar
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `acta-extranjeria-${pasaporteId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      NotificationService.update(
        loadingToast,
        "Acta de Extranjería descargada exitosamente",
        "success",
      );
    } catch (error: any) {
      console.error("Error al generar Acta de Extranjería:", error);
      NotificationService.error(
        error.message || "Error al generar el Acta de Extranjería",
      );
    }
  };

  const filteredPasaportes = pasaportes.filter((p) => {
    const matchesSearch =
      p.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.profesor?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.profesor?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "todos") return matchesSearch;
    if (activeTab === "vencidos")
      return matchesSearch && alertas.vencidos.some((v) => v.id === p.id);
    if (activeTab === "proximos")
      return matchesSearch && alertas.proximos30.some((v) => v.id === p.id);
    return matchesSearch;
  });

  const getStatusBadge = (fechaVencimiento: string) => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diffTime = vencimiento.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <Badge variant="destructive">Vencido ({Math.abs(diffDays)} días)</Badge>
      );
    }
    if (diffDays <= 30) {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-600">
          Vence en {diffDays} días
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-green-500 text-green-600">
        Vigente
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-lg font-medium">Cargando pasaportes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            Error al cargar pasaportes
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={loadData} variant="default">
              Reintentar
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pasaportes</h2>
          <p className="text-muted-foreground">
            Gestión de pasaportes y alertas de vencimiento
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push("/dashboard/tramites/importar-pasaportes")
            }
          >
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button
            onClick={() => router.push("/dashboard/tramites/nuevo")}
            className="glass-button"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Pasaporte
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {(alertas.vencidos.length > 0 || alertas.proximos30.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {alertas.vencidos.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-lg font-bold text-red-600">
                      {alertas.vencidos.length} Pasaportes Vencidos
                    </p>
                    <p className="text-sm text-red-600/80">
                      Requieren renovación inmediata
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {alertas.proximos30.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-lg font-bold text-yellow-600">
                      {alertas.proximos30.length} Próximos a Vencer
                    </p>
                    <p className="text-sm text-yellow-600/80">
                      Vencen en los próximos 30 días
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tabs y Búsqueda */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Listado de Pasaportes
            </CardTitle>
            <div className="flex items-center gap-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="todos">
                    Todos ({pasaportes.length})
                  </TabsTrigger>
                  <TabsTrigger value="vencidos">
                    Vencidos ({alertas.vencidos.length})
                  </TabsTrigger>
                  <TabsTrigger value="proximos">
                    Próximos ({alertas.proximos30.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPasaportes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "No se encontraron pasaportes con ese criterio"
                : "No hay pasaportes registrados"}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Número</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Profesor
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      No. Archivo
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Vencimiento
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPasaportes.map((pasaporte) => (
                    <tr key={pasaporte.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono">
                        {pasaporte.numero}
                      </td>
                      <td className="px-4 py-3">
                        {pasaporte.profesor ? (
                          <div>
                            <p className="font-medium">
                              {pasaporte.profesor.nombre}{" "}
                              {pasaporte.profesor.apellidos}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              CI: {pasaporte.profesor.ci}
                            </p>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {pasaporte.numeroArchivo || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {formatDate(pasaporte.fechaVencimiento)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(pasaporte.fechaVencimiento)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Tooltip text="Descargar Formulario X-22">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDescargarX22(pasaporte.id)}
                              className="hover:bg-blue-600 hover:text-white group"
                            >
                              <FileText className="h-4 w-4 text-blue-600 group-hover:text-white" />
                            </Button>
                          </Tooltip>
                          <Tooltip text="Descargar Acta de Extranjería">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDescargarActaExtranjeria(pasaporte.id)
                              }
                              className="hover:bg-green-600 hover:text-white group"
                            >
                              <ScrollText className="h-4 w-4 text-green-600 group-hover:text-white" />
                            </Button>
                          </Tooltip>
                          <Tooltip text="Ver detalle">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                router.push(
                                  `/dashboard/tramites/${pasaporte.id}`,
                                )
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                          <Tooltip text="Editar">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                router.push(
                                  `/dashboard/tramites/${pasaporte.id}/editar`,
                                )
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

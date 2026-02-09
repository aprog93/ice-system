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
import { useAuthStore } from "@/store/auth-store";
import { toast } from "react-hot-toast";
import {
  Search,
  Plus,
  AlertTriangle,
  Eye,
  FileText,
  Loader2,
  Edit,
} from "lucide-react";
import { getExpiryStatus, getDaysUntilExpiry, formatDate } from "@/lib/utils";

export default function TramitesPage() {
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const [pasaportes, setPasaportes] = useState<Pasaporte[]>([]);
  const [alertas, setAlertas] = useState<{
    vencidos: Pasaporte[];
    proximos30: Pasaporte[];
    proximos90: Pasaporte[];
  }>({ vencidos: [], proximos30: [], proximos90: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");

  const canEdit = hasRole(["ADMIN", "OPERADOR"]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pasaportesData, alertasData] = await Promise.all([
        pasaportesService.getAll({ limit: 100 }),
        pasaportesService.getAlertas(),
      ]);
      setPasaportes(pasaportesData.data);
      setAlertas({
        vencidos: alertasData.vencidos,
        proximos30: alertasData.proximos30,
        proximos90: alertasData.proximos90,
      });
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPasaportes = pasaportes.filter((p) => {
    const matchesSearch =
      p.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.profesor?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.profesor?.apellidos.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "todos") return matchesSearch;
    if (activeTab === "vencidos")
      return matchesSearch && alertas.vencidos.some((v) => v.id === p.id);
    if (activeTab === "proximos")
      return matchesSearch && alertas.proximos30.some((v) => v.id === p.id);
    return matchesSearch;
  });

  const getStatusBadge = (fechaVencimiento: string) => {
    const status = getExpiryStatus(fechaVencimiento);
    const days = getDaysUntilExpiry(fechaVencimiento);

    if (status === "expired") {
      return (
        <Badge variant="destructive">Vencido ({Math.abs(days)} días)</Badge>
      );
    }
    if (status === "warning") {
      return <Badge variant="warning">Vence en {days} días</Badge>;
    }
    return <Badge variant="success">Vigente</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Trámites</h2>
          <p className="text-muted-foreground">Gestión de pasaportes y visas</p>
        </div>
        {canEdit && (
          <Button onClick={() => router.push("/dashboard/tramites/nuevo")}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Pasaporte
          </Button>
        )}
      </div>

      {/* Alertas */}
      {(alertas.vencidos.length > 0 || alertas.proximos30.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {alertas.vencidos.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="flex flex-row items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-red-800">
                  Pasaportes Vencidos ({alertas.vencidos.length})
                </CardTitle>
              </CardHeader>
            </Card>
          )}
          {alertas.proximos30.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="flex flex-row items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-yellow-800">
                  Próximos a Vencer ({alertas.proximos30.length})
                </CardTitle>
              </CardHeader>
            </Card>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="vencidos">Vencidos</TabsTrigger>
          <TabsTrigger value="proximos">Próximos</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por número o profesor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Número
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Profesor
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Expedición
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Vencimiento
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPasaportes.map((pasaporte) => (
                        <tr
                          key={pasaporte.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-sm font-medium">
                            {pasaporte.numero}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {pasaporte.profesor?.nombre}{" "}
                            {pasaporte.profesor?.apellidos}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {pasaporte.tipo}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {formatDate(pasaporte.fechaExpedicion)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {formatDate(pasaporte.fechaVencimiento)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {getStatusBadge(pasaporte.fechaVencimiento)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
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
                              {canEdit && (
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
                              )}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

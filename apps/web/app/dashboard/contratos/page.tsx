"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Contrato, EstadoContrato } from "@/types";
import { contratosService } from "@/services/contratos.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";
import { NotificationService } from "@/services/notification.service";
import {
  Search,
  Plus,
  FileDown,
  Eye,
  Edit,
  Loader2,
  Calendar,
  MapPin,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

const estadoColors: Record<
  EstadoContrato,
  "default" | "secondary" | "success" | "destructive" | "warning"
> = {
  ACTIVO: "success",
  PRORROGADO: "warning",
  CERRADO: "secondary",
  CANCELADO: "destructive",
};

export default function ContratosPage() {
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const canEdit = hasRole(["ADMIN", "OPERADOR"]);

  const loadContratos = async () => {
    try {
      setIsLoading(true);
      const response = await contratosService.getAll({
        page: currentPage,
        limit: 10,
      });
      setContratos(response.data);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (error) {
      NotificationService.error("Error al cargar contratos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContratos();
  }, [currentPage]);

  const handleExport = async () => {
    try {
      const blob = await contratosService.exportarExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contratos-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      NotificationService.success("Exportación completada");
    } catch (error) {
      NotificationService.error("Error al exportar");
    }
  };

  const filteredContratos = contratos.filter(
    (c) =>
      c.profesor?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.profesor?.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.funcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.pais?.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contratos</h2>
          <p className="text-muted-foreground">
            Gestión de contratos y prórrogas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          {canEdit && (
            <Button onClick={() => router.push("/dashboard/contratos/nuevo")}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Contrato
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por profesor, función o país..."
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
                      País
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Período
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Función
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
                  {filteredContratos.map((contrato) => (
                    <tr key={contrato.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">
                        {contrato.numeroConsecutivo}/{contrato.ano}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {contrato.profesor?.nombre}{" "}
                        {contrato.profesor?.apellidos}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {contrato.pais?.nombre}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(contrato.fechaInicio)} -{" "}
                          {formatDate(contrato.fechaFin)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{contrato.funcion}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={estadoColors[contrato.estado]}>
                          {contrato.estado}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(`/dashboard/contratos/${contrato.id}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canEdit &&
                            contrato.estado !== "CERRADO" &&
                            contrato.estado !== "CANCELADO" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/contratos/${contrato.id}/editar`,
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

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

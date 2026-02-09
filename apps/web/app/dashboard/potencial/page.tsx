"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Profesor, EstadoPotencial } from "@/types";
import { profesoresService } from "@/services/profesores.service";
import { NotificationService } from "@/services/notification.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";
import {
  Search,
  Plus,
  FileUp,
  Edit,
  Trash2,
  Eye,
  Loader2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const estadoColors: Record<
  EstadoPotencial,
  "default" | "secondary" | "success" | "destructive" | "warning"
> = {
  ACTIVO: "success",
  EN_PROCESO: "warning",
  CONTRATADO: "default",
  BAJA: "destructive",
  SUSPENDIDO: "secondary",
};

export default function PotencialPage() {
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProfesor, setSelectedProfesor] = useState<Profesor | null>(
    null,
  );

  const canEdit = hasRole(["ADMIN", "OPERADOR"]);
  const canDelete = hasRole(["ADMIN"]);

  const loadProfesores = async () => {
    try {
      setIsLoading(true);
      const response = await profesoresService.getAll({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
      });
      setProfesores(response.data);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (error) {
      NotificationService.error(
        "Error al cargar profesores. Intente recargar la página.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfesores();
  }, [currentPage, searchTerm]);

  const handleDelete = async (profesor: Profesor) => {
    // Confirmación con SweetAlert2
    const confirmed = await NotificationService.confirmDelete(
      `${profesor.nombre} ${profesor.apellidos}`,
    );

    if (!confirmed) return;

    // Mostrar loading
    const loadingToast = NotificationService.loading("Eliminando profesor...");

    try {
      await profesoresService.delete(profesor.id);

      // Cerrar loading y mostrar éxito
      NotificationService.update(
        loadingToast,
        "Profesor eliminado correctamente",
        "success",
      );

      // Diálogo de éxito opcional para acciones importantes
      await NotificationService.successDialog(
        "Eliminación Exitosa",
        `El profesor <strong>${profesor.nombre} ${profesor.apellidos}</strong> ha sido eliminado del sistema.`,
      );

      loadProfesores();
    } catch (error: any) {
      NotificationService.update(loadingToast, "Error al eliminar", "error");
      await NotificationService.errorDialog(
        "Error",
        error.message || "No se pudo eliminar el profesor. Intente nuevamente.",
      );
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Detectar tipo de archivo por nombre
    const isPotencialFile =
      file.name.toLowerCase().includes("potencial") ||
      file.name.toLowerCase().includes("acciones");

    const importType = isPotencialFile
      ? "Potencial por Acciones"
      : "Excel estándar";

    // Confirmar importación
    const confirmed = await NotificationService.confirm(
      `Importar archivo (${importType})`,
      `¿Desea importar el archivo <strong>${file.name}</strong>?<br>
      <span class="text-sm text-gray-500">Tipo detectado: ${importType}</span><br>
      Esto puede tardar unos momentos.`,
      {
        confirmText: "Sí, importar",
        cancelText: "Cancelar",
        icon: "info",
      },
    );

    if (!confirmed) return;

    // Loading con progreso
    const loadingToast = NotificationService.loading(
      `Importando datos (${importType})...`,
    );

    try {
      let result;

      if (isPotencialFile) {
        // Usar endpoint específico para "Potencial por acciones"
        result = await profesoresService.importarPotencial(file);

        // Cerrar toast de loading y mostrar éxito
        NotificationService.update(
          loadingToast,
          "Importación completada",
          "success",
        );

        // Reporte detallado para importación de potencial
        await NotificationService.importReport({
          creados: result.profesoresCreados || 0,
          actualizados: result.profesoresActualizados || 0,
          errores: result.errores?.length || 0,
          detalles: result.errores?.map(
            (e: any) => `Hoja ${e.hoja}, Fila ${e.fila}: ${e.error}`,
          ),
        });
      } else {
        // Usar endpoint estándar para Excel
        result = await profesoresService.importarExcel(file);

        // Cerrar toast de loading y mostrar éxito
        NotificationService.update(
          loadingToast,
          "Importación completada",
          "success",
        );

        // Reporte detallado con SweetAlert2
        await NotificationService.importReport({
          creados: result.creados || 0,
          actualizados: result.actualizados || 0,
          errores: result.errores?.length || 0,
          detalles: result.errores?.map(
            (e: any) => `Fila ${e.fila}: ${e.error}`,
          ),
        });
      }

      loadProfesores();
    } catch (error: any) {
      // Cerrar toast de loading y mostrar error
      NotificationService.update(loadingToast, "Error en importación", "error");
      await NotificationService.errorDialog(
        "Error de Importación",
        error.message ||
          "No se pudo importar el archivo. Verifique el formato.",
      );
    }

    // Limpiar input
    e.target.value = "";
  };

  const handleViewDetails = (profesor: Profesor) => {
    setSelectedProfesor(profesor);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Potencial</h2>
          <p className="text-muted-foreground">
            Gestión de profesores en potencial
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <>
              <Button variant="outline" asChild>
                <label>
                  <FileUp className="mr-2 h-4 w-4" />
                  Importar
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleImport}
                  />
                </label>
              </Button>
              <Button onClick={() => router.push("/dashboard/potencial/nuevo")}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Profesor
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, CI..."
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
                      CI
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Edad
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Provincia
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
                  {profesores.map((profesor) => (
                    <tr key={profesor.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{profesor.ci}</td>
                      <td className="px-4 py-3 text-sm">
                        {profesor.nombre} {profesor.apellidos}
                      </td>
                      <td className="px-4 py-3 text-sm">{profesor.edad}</td>
                      <td className="px-4 py-3 text-sm">
                        {profesor.provincia?.nombre}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={estadoColors[profesor.estadoPotencial]}>
                          {profesor.estadoPotencial}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <Dialog
                            open={selectedProfesor?.id === profesor.id}
                            onOpenChange={(open) => {
                              if (!open) setSelectedProfesor(null);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetails(profesor)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl" hideClose>
                              <DialogHeader className="flex flex-row items-center justify-between">
                                <DialogTitle>Detalles del Profesor</DialogTitle>
                                <button
                                  onClick={() => setSelectedProfesor(null)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </DialogHeader>
                              {selectedProfesor && (
                                <div className="grid gap-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">
                                        Nombre Completo
                                      </label>
                                      <p>
                                        {selectedProfesor.nombre}{" "}
                                        {selectedProfesor.apellidos}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">
                                        Carnet de Identidad
                                      </label>
                                      <p>{selectedProfesor.ci}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">
                                        Edad
                                      </label>
                                      <p>{selectedProfesor.edad} años</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">
                                        Sexo
                                      </label>
                                      <p>{selectedProfesor.sexo}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">
                                        Estado Civil
                                      </label>
                                      <p>{selectedProfesor.estadoCivil}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">
                                        Teléfono
                                      </label>
                                      <p>
                                        {selectedProfesor.telefonoMovil ||
                                          "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">
                                        Email
                                      </label>
                                      <p>{selectedProfesor.email || "N/A"}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">
                                        Nivel de Inglés
                                      </label>
                                      <p>{selectedProfesor.nivelIngles}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      Dirección
                                    </label>
                                    <p>{selectedProfesor.direccion || "N/A"}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">
                                        Provincia
                                      </label>
                                      <p>
                                        {selectedProfesor.provincia?.nombre}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">
                                        Municipio
                                      </label>
                                      <p>
                                        {selectedProfesor.municipio?.nombre}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                router.push(
                                  `/dashboard/potencial/${profesor.id}/editar`,
                                )
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(profesor)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
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

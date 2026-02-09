"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, Search, Download, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { actasExtranjeriaService } from "@/services/actas-extranjeria.service";
import { NotificationService } from "@/services/notification.service";
import type { ActaExtranjeria } from "@/types";

export default function ActasExtranjeriaPage() {
  const router = useRouter();
  const [actas, setActas] = useState<ActaExtranjeria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadActas();
  }, []);

  const loadActas = async () => {
    try {
      setIsLoading(true);
      const response = await actasExtranjeriaService.getAll({
        limit: 100,
      });
      setActas(response.data);
    } catch (error) {
      NotificationService.error("Error al cargar actas de extranjería");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await NotificationService.confirmDelete(
      "acta de extranjería",
    );

    if (confirmed) {
      try {
        await actasExtranjeriaService.delete(id);
        NotificationService.success("Acta eliminada correctamente");
        loadActas();
      } catch (error) {
        NotificationService.error("Error al eliminar el acta");
      }
    }
  };

  const handleDownloadPDF = async (acta: ActaExtranjeria) => {
    try {
      await actasExtranjeriaService.downloadPDF(
        acta.id,
        acta.numeroActa,
        acta.ano,
      );
    } catch (error) {
      NotificationService.error("Error al descargar el PDF");
    }
  };

  const filteredActas = actas.filter(
    (acta) =>
      acta.numeroActa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acta.profesor?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acta.profesor?.apellidos.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Actas de Extranjería
          </h2>
          <p className="text-muted-foreground">
            Gestione las actas de extranjería de los profesores
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/actas-extranjeria/nuevo")}
          className="glass-button"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Acta
        </Button>
      </div>

      {/* Search */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número o profesor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Listado de Actas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Año</TableHead>
                <TableHead>Profesor</TableHead>
                <TableHead>País Destino</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filteredActas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No se encontraron actas
                  </TableCell>
                </TableRow>
              ) : (
                filteredActas.map((acta) => (
                  <TableRow key={acta.id}>
                    <TableCell>
                      <Badge variant="outline">{acta.numeroActa}</Badge>
                    </TableCell>
                    <TableCell>{acta.ano}</TableCell>
                    <TableCell>
                      {acta.profesor ? (
                        <div>
                          <div className="font-medium">
                            {acta.profesor.nombre} {acta.profesor.apellidos}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            CI: {acta.profesor.ci}
                          </div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {acta.paisDestino?.nombreEs ||
                        acta.paisDestino?.nombre ||
                        "-"}
                    </TableCell>
                    <TableCell>
                      {new Date(acta.fechaActa).toLocaleDateString("es-ES")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadPDF(acta)}
                          title="Descargar PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            router.push(
                              `/dashboard/actas-extranjeria/${acta.id}/editar`,
                            )
                          }
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(acta.id)}
                          title="Eliminar"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

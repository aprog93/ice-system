"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  SkipForward,
  Calendar,
  Eye,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { api } from "@/services/api";
import { NotificationService } from "@/services/notification.service";

interface ImportacionHistorial {
  id: string;
  tipo: string;
  nombreArchivo: string;
  totalRegistros: number;
  exitosos: number;
  errores: number;
  saltados: number;
  createdAt: string;
}

export default function HistorialImportacionesPage() {
  const router = useRouter();
  const [historial, setHistorial] = useState<ImportacionHistorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<ImportacionHistorial[]>(
        "/pasaportes-import/historial",
      );
      setHistorial(data);
    } catch (error) {
      NotificationService.error("Error al cargar el historial");
    } finally {
      setIsLoading(false);
    }
  };

  const descargarReporte = async (id: string, nombreArchivo: string) => {
    try {
      const data = await api.get<any>(`/pasaportes-import/historial/${id}`);

      // Crear reporte JSON
      const reporte = {
        id: data.id,
        tipo: data.tipo,
        nombreArchivo: data.nombreArchivo,
        fecha: data.createdAt,
        resumen: {
          total: data.totalRegistros,
          exitosos: data.exitosos,
          errores: data.errores,
          saltados: data.saltados,
        },
        detalles: data.detalle,
      };

      const blob = new Blob([JSON.stringify(reporte, null, 2)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `reporte_${nombreArchivo.replace(/\.[^/.]+$/, "")}_${id.slice(0, 8)}.json`;
      link.click();
    } catch (error) {
      NotificationService.error("Error al descargar el reporte");
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/dashboard/tramites/importar-pasaportes")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Historial de Importaciones
          </h2>
          <p className="text-muted-foreground">
            Registro de todas tus importaciones de pasaportes
          </p>
        </div>
      </div>

      {/* Lista */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Importaciones Realizadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : historial.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No has realizado ninguna importación aún
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Archivo</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center text-green-600">
                    Exitosos
                  </TableHead>
                  <TableHead className="text-center text-yellow-600">
                    Saltados
                  </TableHead>
                  <TableHead className="text-center text-red-600">
                    Errores
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historial.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatearFecha(item.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">
                          {item.nombreArchivo}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {item.totalRegistros}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="border-green-200 text-green-600"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {item.exitosos}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="border-yellow-200 text-yellow-600"
                      >
                        <SkipForward className="mr-1 h-3 w-3" />
                        {item.saltados}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="border-red-200 text-red-600"
                      >
                        <AlertCircle className="mr-1 h-3 w-3" />
                        {item.errores}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          descargarReporte(item.id, item.nombreArchivo)
                        }
                      >
                        <Download className="mr-1 h-4 w-4" />
                        Reporte
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Nota */}
      <div className="text-sm text-muted-foreground">
        <p>
          <strong>Nota:</strong> Solo puedes ver tus propias importaciones. Cada
          usuario tiene acceso exclusivo a su historial.
        </p>
      </div>
    </div>
  );
}

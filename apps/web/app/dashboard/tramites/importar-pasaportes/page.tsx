"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  SkipForward,
  Loader2,
  Download,
  History,
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
import { NotificationService } from "@/services/notification.service";
import { api } from "@/services/api";

interface DetalleImportacion {
  fila: number;
  numeroPasaporte: string;
  colaborador: string;
  estado: "EXITO" | "ERROR" | "SALTADO";
  mensaje: string;
  pasaporteId?: string;
}

interface ResultadoImportacion {
  message: string;
  historialId: string;
  resumen: {
    total: number;
    exitosos: number;
    errores: number;
    saltados: {
      total: number;
      existentes: number;
      sinProfesor: number;
    };
  };
  detalles: DetalleImportacion[];
}

export default function ImportarPasaportesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      NotificationService.warning("Por favor selecciona un archivo");
      return;
    }

    setIsUploading(true);
    const loadingToast = NotificationService.loading(
      "Importando pasaportes...",
    );

    try {
      const formData = new FormData();
      formData.append("archivo", selectedFile);

      // Detectar tipo de archivo y usar el endpoint correcto
      const extension = selectedFile.name.split(".").pop()?.toLowerCase();
      const endpoint =
        extension === "xlsx" || extension === "xls"
          ? "/pasaportes-import/excel"
          : "/pasaportes-import/csv";

      const response = await api.upload<ResultadoImportacion>(
        endpoint,
        formData,
      );

      const totalSaltados = response.resumen.saltados.total;
      const sinProfesor = response.resumen.saltados.sinProfesor;
      const existentes = response.resumen.saltados.existentes;
      let mensaje = `Importación completada: ${response.resumen.exitosos} exitosos, ${response.resumen.errores} errores, ${totalSaltados} saltados`;
      if (sinProfesor > 0) {
        mensaje += ` (${sinProfesor} sin profesor)`;
      }
      NotificationService.update(
        loadingToast,
        mensaje,
        response.resumen.errores > 0 ? "error" : "success",
      );

      setResultado(response);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      NotificationService.update(
        loadingToast,
        error.message || "Error al importar",
        "error",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const descargarPlantilla = () => {
    const csvContent = `No.,Pasaporte #,No. Archivo,Colaborador,Fecha Vencimiento,Ubicación,PAIS
1,E355896,A-0010,"ALVAREZ PEREZ, LUIS",3/14/2024,OK,`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "plantilla_pasaportes.csv";
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Importar Pasaportes
          </h2>
          <p className="text-muted-foreground">
            Importe pasaportes masivamente desde un archivo CSV o Excel
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={descargarPlantilla}
            className="glass-button"
          >
            <Download className="mr-2 h-4 w-4" />
            Plantilla
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              router.push("/dashboard/tramites/importar-pasaportes/historial")
            }
            className="glass-button"
          >
            <History className="mr-2 h-4 w-4" />
            Historial
          </Button>
        </div>
      </div>

      {/* Upload Zone */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center">
            {isUploading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <p className="text-lg font-medium">Importando...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Upload className="h-12 w-12 text-slate-400" />
                <div>
                  <p className="text-lg font-medium">Selecciona un archivo</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Formatos aceptados: .csv, .xlsx, .xls (máx. 10MB)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload">
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span>Seleccionar archivo</span>
                  </Button>
                </label>
                {selectedFile && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium">Archivo seleccionado:</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedFile.name} (
                      {(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                    <Button
                      className="mt-2 glass-button"
                      onClick={handleUpload}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Iniciar Importación
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {resultado && (
        <>
          {/* Resumen */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Procesados
                    </p>
                    <p className="text-3xl font-bold">
                      {resultado.resumen.total}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      Exitosos
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {resultado.resumen.exitosos}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">
                      Saltados
                    </p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {resultado.resumen.saltados.total}
                    </p>
                    {resultado.resumen.saltados.sinProfesor > 0 && (
                      <p className="text-xs text-yellow-600 mt-1">
                        {resultado.resumen.saltados.sinProfesor} sin profesor
                      </p>
                    )}
                    {resultado.resumen.saltados.existentes > 0 && (
                      <p className="text-xs text-yellow-600 mt-1">
                        {resultado.resumen.saltados.existentes} ya existentes
                      </p>
                    )}
                  </div>
                  <SkipForward className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Errores</p>
                    <p className="text-3xl font-bold text-red-600">
                      {resultado.resumen.errores}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalles */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Detalle de la Importación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Fila</TableHead>
                      <TableHead>Pasaporte</TableHead>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Mensaje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultado.detalles.map((detalle, index) => (
                      <TableRow key={index}>
                        <TableCell>{detalle.fila}</TableCell>
                        <TableCell className="font-mono">
                          {detalle.numeroPasaporte}
                        </TableCell>
                        <TableCell>{detalle.colaborador}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              detalle.estado === "EXITO"
                                ? "default"
                                : detalle.estado === "SALTADO"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className={
                              detalle.estado === "EXITO"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : detalle.estado === "SALTADO"
                                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                  : ""
                            }
                          >
                            {detalle.estado === "EXITO" && (
                              <CheckCircle className="mr-1 h-3 w-3" />
                            )}
                            {detalle.estado === "SALTADO" && (
                              <SkipForward className="mr-1 h-3 w-3" />
                            )}
                            {detalle.estado === "ERROR" && (
                              <AlertCircle className="mr-1 h-3 w-3" />
                            )}
                            {detalle.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {detalle.mensaje}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Instrucciones */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Formato del Archivo</h4>
            <p className="text-sm text-muted-foreground">
              Tanto CSV como Excel deben tener las siguientes columnas:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-4">
              <li>
                <strong>No.</strong> - Número correlativo (opcional)
              </li>
              <li>
                <strong>Pasaporte #</strong> - Número del pasaporte (requerido)
              </li>
              <li>
                <strong>No. Archivo</strong> - Número de archivo físico
                (opcional)
              </li>
              <li>
                <strong>Colaborador</strong> - Formato: &quot;APELLIDOS,
                NOMBRE&quot; (requerido)
              </li>
              <li>
                <strong>Fecha Vencimiento</strong> - Formato: MM/DD/YYYY
              </li>
              <li>
                <strong>Ubicación</strong> - Estado físico (OK, NO ESTA, etc.)
              </li>
              <li>
                <strong>PAIS</strong> - País de destino (opcional)
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Reglas de Importación</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-4">
              <li>
                El profesor debe existir en <strong>Potencial</strong> con el
                nombre exacto
              </li>
              <li>
                Si el pasaporte ya existe, se <strong>saltará</strong> sin
                modificar
              </li>
              <li>
                Se creará un <strong>registro de historial</strong> que solo
                podrás ver tú
              </li>
              <li>
                Los registros con errores no se importan pero se reportan en el
                detalle
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

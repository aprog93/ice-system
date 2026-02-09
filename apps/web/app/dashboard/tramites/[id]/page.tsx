"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  BookUser,
  CreditCard,
  Loader2,
  Plane,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { pasaportesService } from "@/services/pasaportes.service";
import { visasService } from "@/services/pasaportes.service";
import { NotificationService } from "@/services/notification.service";
import { useAuthStore } from "@/store/auth-store";
import { Pasaporte, Visa, Profesor } from "@/types";
import { formatDate, getExpiryStatus, getDaysUntilExpiry } from "@/lib/utils";

export default function PasaporteDetallePage() {
  const router = useRouter();
  const params = useParams();
  const pasaporteId = params.id as string;
  const { hasRole } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [pasaporte, setPasaporte] = useState<Pasaporte | null>(null);
  const [visas, setVisas] = useState<Visa[]>([]);
  const [visaToDelete, setVisaToDelete] = useState<Visa | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const canEdit = hasRole(["ADMIN", "OPERADOR"]);
  const canDelete = hasRole(["ADMIN"]);

  useEffect(() => {
    loadData();
  }, [pasaporteId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pasaporteData, visasData] = await Promise.all([
        pasaportesService.getById(pasaporteId),
        visasService.getAll({ pasaporteId }),
      ]);

      setPasaporte(pasaporteData);
      setVisas(visasData.data);
    } catch (error) {
      NotificationService.error("Error al cargar datos del pasaporte");
      router.push("/dashboard/tramites");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePasaporte = async () => {
    const confirmed = await NotificationService.confirm(
      "¿Eliminar pasaporte?",
      `Está a punto de eliminar el pasaporte ${pasaporte?.numero}. Esta acción no se puede deshacer.`,
      {
        confirmText: "Sí, eliminar",
        cancelText: "Cancelar",
        icon: "warning",
        confirmColor: "#ef4444",
      },
    );

    if (confirmed) {
      try {
        await pasaportesService.delete(pasaporteId);
        await NotificationService.successDialog(
          "Eliminado",
          "El pasaporte ha sido eliminado correctamente.",
        );
        router.push("/dashboard/tramites");
      } catch (error) {
        NotificationService.error("Error al eliminar el pasaporte");
      }
    }
  };

  const handleDeleteVisa = async () => {
    if (!visaToDelete) return;

    setIsDeleting(true);
    try {
      await visasService.delete(visaToDelete.id);
      setVisas(visas.filter((v) => v.id !== visaToDelete.id));
      NotificationService.success("Visa eliminada correctamente");
      setVisaToDelete(null);
    } catch (error) {
      NotificationService.error("Error al eliminar la visa");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      const blob = await pasaportesService.generarSolicitud(pasaporteId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `solicitud-pasaporte-${pasaporte?.numero}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      NotificationService.success("PDF descargado correctamente");
    } catch (error) {
      NotificationService.error("Error al generar el PDF");
    }
  };

  const handleDescargarX22 = async () => {
    try {
      const loadingToast = NotificationService.loading(
        "Generando formulario X-22...",
      );
      const pdfBlob = await pasaportesService.generarFormularioX22(pasaporteId);

      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `solicitud-pasaporte-X22-${pasaporte?.numero}.pdf`;
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

  const getPasaporteStatusBadge = () => {
    if (!pasaporte) return null;
    const status = getExpiryStatus(pasaporte.fechaVencimiento);
    const days = getDaysUntilExpiry(pasaporte.fechaVencimiento);

    if (status === "expired") {
      return (
        <Badge variant="destructive" className="text-sm">
          <XCircle className="mr-1 h-3 w-3" />
          Vencido ({Math.abs(days)} días)
        </Badge>
      );
    }
    if (status === "warning") {
      return (
        <Badge variant="warning" className="text-sm">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Vence en {days} días
        </Badge>
      );
    }
    return (
      <Badge variant="success" className="text-sm">
        <CheckCircle className="mr-1 h-3 w-3" />
        Vigente
      </Badge>
    );
  };

  const getVisaStatusBadge = (fechaVencimiento: string) => {
    const status = getExpiryStatus(fechaVencimiento);
    const days = getDaysUntilExpiry(fechaVencimiento);

    if (status === "expired") {
      return <Badge variant="destructive">Vencida</Badge>;
    }
    if (status === "warning") {
      return <Badge variant="warning">{days} días</Badge>;
    }
    return <Badge variant="success">Vigente</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!pasaporte) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Pasaporte no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/tramites")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">
                Pasaporte {pasaporte.numero}
              </h2>
              {getPasaporteStatusBadge()}
            </div>
            <p className="text-muted-foreground">
              {pasaporte.profesor?.nombre} {pasaporte.profesor?.apellidos} -{" "}
              {pasaporte.profesor?.ci}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleGeneratePDF}
            className="glass-button"
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>

          <Button
            variant="outline"
            onClick={handleDescargarX22}
            className="glass-button"
          >
            <FileText className="mr-2 h-4 w-4" />
            Formulario X-22
          </Button>

          {canEdit && (
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/dashboard/tramites/${pasaporteId}/editar`)
              }
              className="glass-button"
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}

          {canDelete && (
            <Button
              variant="destructive"
              onClick={handleDeletePasaporte}
              className="glass-button-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="glass-card grid w-full grid-cols-2 lg:w-[300px]">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <BookUser className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="visas" className="flex items-center gap-2">
            <Plane className="h-4 w-4" />
            <span className="hidden sm:inline">Visas ({visas.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Información General */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Card: Datos del Pasaporte */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Datos del Pasaporte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium">{pasaporte.tipo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Número</p>
                    <p className="font-medium">{pasaporte.numero}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Fecha de Expedición
                      </p>
                      <p className="font-medium">
                        {formatDate(pasaporte.fechaExpedicion)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Fecha de Vencimiento
                      </p>
                      <p className="font-medium">
                        {formatDate(pasaporte.fechaVencimiento)}
                      </p>
                    </div>
                  </div>

                  {pasaporte.lugarExpedicion && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Lugar de Expedición
                        </p>
                        <p className="font-medium">
                          {pasaporte.lugarExpedicion}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {pasaporte.observaciones && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Observaciones
                      </p>
                      <p className="mt-1 text-sm">{pasaporte.observaciones}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Card: Datos del Profesor */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookUser className="h-5 w-5" />
                  Datos del Profesor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pasaporte.profesor ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Nombre Completo
                      </p>
                      <p className="font-medium text-lg">
                        {pasaporte.profesor.nombre}{" "}
                        {pasaporte.profesor.apellidos}
                      </p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">CI</p>
                        <p className="font-medium">{pasaporte.profesor.ci}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Edad</p>
                        <p className="font-medium">
                          {pasaporte.profesor.edad} años
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Dirección</p>
                      <p className="font-medium">
                        {pasaporte.profesor.direccion || "No especificada"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Teléfono
                        </p>
                        <p className="font-medium">
                          {pasaporte.profesor.telefonoMovil || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">
                          {pasaporte.profesor.email || "N/A"}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() =>
                        router.push(
                          `/dashboard/potencial/${pasaporte.profesorId}`,
                        )
                      }
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Ver Ficha del Profesor
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Información no disponible
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Visas */}
        <TabsContent value="visas" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Visas Asociadas</h3>
              <p className="text-sm text-muted-foreground">
                Gestione las visas asociadas a este pasaporte
              </p>
            </div>
            {canEdit && (
              <Button
                onClick={() => {
                  // TODO: Abrir modal o navegar a crear visa
                  NotificationService.info("Funcionalidad en desarrollo");
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Visa
              </Button>
            )}
          </div>

          {visas.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Plane className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">
                  No hay visas registradas
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
                  Este pasaporte no tiene visas asociadas. Puede agregar visas
                  usando el botón "Agregar Visa".
                </p>
                {canEdit && (
                  <Button
                    className="mt-4"
                    onClick={() => {
                      NotificationService.info("Funcionalidad en desarrollo");
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Primera Visa
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visas.map((visa) => (
                <Card key={visa.id} className="glass-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{visa.tipo}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {visa.numero || "Sin número"}
                        </p>
                      </div>
                      {getVisaStatusBadge(visa.fechaVencimiento)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">País:</span>
                        <span className="font-medium">{visa.paisEmision}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Emisión:</span>
                        <span>{formatDate(visa.fechaEmision)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Vencimiento:
                        </span>
                        <span>{formatDate(visa.fechaVencimiento)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entradas:</span>
                        <span>{visa.numeroEntradas}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duración:</span>
                        <span>{visa.duracionDias} días</span>
                      </div>
                    </div>

                    {visa.observaciones && (
                      <div className="rounded bg-muted p-2 text-xs">
                        {visa.observaciones}
                      </div>
                    )}

                    {canEdit && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            NotificationService.info(
                              "Funcionalidad en desarrollo",
                            );
                          }}
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setVisaToDelete(visa)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Confirmar eliminación de visa */}
      <Dialog open={!!visaToDelete} onOpenChange={() => setVisaToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar visa?</DialogTitle>
            <DialogDescription>
              Está a punto de eliminar la visa {visaToDelete?.tipo} de{" "}
              {visaToDelete?.paisEmision}. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVisaToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteVisa}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

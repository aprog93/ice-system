"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  FileText,
  Edit,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { contratosService } from "@/services/contratos.service";
import { prorrogasService } from "@/services/prorrogas.service";
import { NotificationService } from "@/services/notification.service";
import { Contrato, Prorroga } from "@/types";
import { formatDate } from "@/lib/utils";

export default function ContratoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const contratoId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [prorrogas, setProrrogas] = useState<Prorroga[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fechaDesde: "",
    fechaHasta: "",
    motivo: "",
    observaciones: "",
  });

  useEffect(() => {
    loadData();
  }, [contratoId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [contratoData, prorrogasData] = await Promise.all([
        contratosService.getById(contratoId),
        prorrogasService.getAll({ contratoId }),
      ]);

      setContrato(contratoData);
      setProrrogas(prorrogasData.data || []);
    } catch (error) {
      NotificationService.error("Error al cargar datos");
      router.push("/dashboard/contratos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fechaDesde || !formData.fechaHasta || !formData.motivo) {
      NotificationService.error("Complete los campos requeridos");
      return;
    }

    setIsSubmitting(true);
    try {
      await prorrogasService.create({
        contratoId,
        fechaDesde: formData.fechaDesde,
        fechaHasta: formData.fechaHasta,
        motivo: formData.motivo,
        observaciones: formData.observaciones || undefined,
      });

      NotificationService.success("Prórroga agregada correctamente");
      setShowModal(false);
      setFormData({
        fechaDesde: "",
        fechaHasta: "",
        motivo: "",
        observaciones: "",
      });
      loadData();
    } catch (error: any) {
      NotificationService.error(error.message || "Error al crear prórroga");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (prorrogaId: string) => {
    const confirmed = await NotificationService.confirm(
      "¿Eliminar prórroga?",
      "Esta acción no se puede deshacer.",
    );

    if (!confirmed) return;

    try {
      await prorrogasService.delete(prorrogaId);
      NotificationService.success("Prórroga eliminada");
      loadData();
    } catch (error: any) {
      NotificationService.error(error.message || "Error al eliminar");
    }
  };

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      ACTIVO: "bg-green-100 text-green-800",
      PRORROGADO: "bg-blue-100 text-blue-800",
      CERRADO: "bg-gray-100 text-gray-800",
      CANCELADO: "bg-red-100 text-red-800",
    };
    return styles[estado] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Contrato no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/contratos")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Contrato #{contrato.numeroConsecutivo}/{contrato.ano}
            </h2>
            <p className="text-muted-foreground">
              {contrato.profesor?.nombre} {contrato.profesor?.apellidos}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/contratos/${contratoId}/editar`)
            }
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Prórroga
          </Button>
        </div>
      </div>

      {/* Info del Contrato */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado:</span>
              <Badge className={getEstadoBadge(contrato.estado)}>
                {contrato.estado}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">País:</span>
              <span className="font-medium">{contrato.pais?.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Función:</span>
              <span className="font-medium">{contrato.funcion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Centro:</span>
              <span className="font-medium">{contrato.centroTrabajo}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Fechas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inicio:</span>
              <span className="font-medium">
                {formatDate(contrato.fechaInicio)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fin:</span>
              <span className="font-medium">
                {formatDate(contrato.fechaFin)}
              </span>
            </div>
            {contrato.fechaFirma && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Firma:</span>
                <span className="font-medium">
                  {formatDate(contrato.fechaFirma)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prórrogas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Prórrogas ({prorrogas.length})</CardTitle>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Prórroga
          </Button>
        </CardHeader>
        <CardContent>
          {prorrogas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Sin prórrogas</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-2">
                Este contrato no tiene prórrogas registradas. Hacé clic en
                &quot;Nueva Prórroga&quot; para extender el contrato.
              </p>
              <Button className="mt-4" onClick={() => setShowModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Prórroga
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {prorrogas.map((prorroga) => (
                <div
                  key={prorroga.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        Prórroga #{prorroga.numeroProrroga}
                      </span>
                      <Badge variant="outline">{prorroga.motivo}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(prorroga.fechaDesde)} →{" "}
                      {formatDate(prorroga.fechaHasta)}
                    </div>
                    {prorroga.observaciones && (
                      <div className="text-sm text-muted-foreground">
                        {prorroga.observaciones}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(prorroga.id)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Nueva Prórroga */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nueva Prórroga</DialogTitle>
            <DialogDescription>
              Extendé la vigencia del contrato agregando una prórroga.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaDesde">Fecha Desde *</Label>
                  <Input
                    id="fechaDesde"
                    type="date"
                    value={formData.fechaDesde}
                    onChange={(e) =>
                      setFormData({ ...formData, fechaDesde: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaHasta">Fecha Hasta *</Label>
                  <Input
                    id="fechaHasta"
                    type="date"
                    value={formData.fechaHasta}
                    onChange={(e) =>
                      setFormData({ ...formData, fechaHasta: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo *</Label>
                <Input
                  id="motivo"
                  placeholder="Ej: Extensión de proyecto"
                  value={formData.motivo}
                  onChange={(e) =>
                    setFormData({ ...formData, motivo: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Observaciones adicionales..."
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Prórroga"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

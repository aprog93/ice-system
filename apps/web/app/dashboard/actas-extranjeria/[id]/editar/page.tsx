"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, ArrowLeft, FileText, User, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { actasExtranjeriaService } from "@/services/actas-extranjeria.service";
import { profesoresService } from "@/services/profesores.service";
import { nomencladoresService } from "@/services/nomencladores.service";
import { NotificationService } from "@/services/notification.service";
import type { Profesor, Pais, ActaExtranjeria } from "@/types";

const actaSchema = z.object({
  numeroActa: z.string().min(1, "El número de acta es requerido"),
  ano: z.coerce.number().min(2020, "Año inválido").max(2100, "Año inválido"),
  profesorId: z.string().min(1, "Debe seleccionar un profesor"),
  fechaActa: z.string().min(1, "La fecha es requerida"),
  funcion: z.string().min(1, "La función es requerida"),
  paisDestinoId: z.string().min(1, "Debe seleccionar un país"),
  observaciones: z.string().optional(),
});

type ActaFormData = z.infer<typeof actaSchema>;

export default function EditarActaPage() {
  const router = useRouter();
  const params = useParams();
  const actaId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [paises, setPaises] = useState<Pais[]>([]);
  const [acta, setActa] = useState<ActaExtranjeria | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ActaFormData>({
    resolver: zodResolver(actaSchema),
  });

  useEffect(() => {
    loadData();
  }, [actaId]);

  const loadData = async () => {
    try {
      setIsDataLoading(true);
      const [actaData, profesoresResponse, paisesData] = await Promise.all([
        actasExtranjeriaService.getById(actaId),
        profesoresService.getAll(),
        nomencladoresService.getPaises(),
      ]);

      setActa(actaData);
      setProfesores(profesoresResponse.data);
      setPaises(paisesData);

      // Populate form
      reset({
        numeroActa: actaData.numeroActa,
        ano: actaData.ano,
        profesorId: actaData.profesorId,
        fechaActa: actaData.fechaActa.split("T")[0],
        funcion: actaData.funcion,
        paisDestinoId: actaData.paisDestinoId,
        observaciones: actaData.observaciones || "",
      });
    } catch (error) {
      NotificationService.error("Error al cargar datos del acta");
      router.push("/dashboard/actas-extranjeria");
    } finally {
      setIsDataLoading(false);
    }
  };

  const onSubmit = async (data: ActaFormData) => {
    setIsLoading(true);
    const loadingToast = NotificationService.loading("Actualizando acta...");

    try {
      await actasExtranjeriaService.update(actaId, data);

      NotificationService.update(
        loadingToast,
        "Acta actualizada exitosamente",
        "success",
      );

      await NotificationService.successDialog(
        "Actualización Exitosa",
        `El acta número <strong>${data.numeroActa}/${data.ano}</strong> ha sido actualizada correctamente.`,
      );

      router.push("/dashboard/actas-extranjeria");
    } catch (error: any) {
      NotificationService.update(loadingToast, "Error al actualizar", "error");
      await NotificationService.errorDialog(
        "Error",
        error.message || "No se pudo actualizar el acta.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isDataLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
            onClick={() => router.push("/dashboard/actas-extranjeria")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Editar Acta de Extranjería
            </h2>
            <p className="text-muted-foreground">
              Modifique los datos del acta {acta?.numeroActa}/{acta?.ano}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={isLoading}
          className="glass-button"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar Cambios
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información del Acta */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información del Acta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Número de Acta */}
              <div className="space-y-2">
                <Label htmlFor="numeroActa">
                  Número de Acta <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="numeroActa"
                  {...register("numeroActa")}
                  placeholder="001"
                  className={errors.numeroActa ? "border-red-500" : ""}
                />
                {errors.numeroActa && (
                  <p className="text-xs text-red-500">
                    {errors.numeroActa.message}
                  </p>
                )}
              </div>

              {/* Año */}
              <div className="space-y-2">
                <Label htmlFor="ano">
                  Año <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ano"
                  type="number"
                  {...register("ano")}
                  placeholder="2024"
                  className={errors.ano ? "border-red-500" : ""}
                />
                {errors.ano && (
                  <p className="text-xs text-red-500">{errors.ano.message}</p>
                )}
              </div>

              {/* Fecha del Acta */}
              <div className="space-y-2">
                <Label htmlFor="fechaActa">
                  Fecha del Acta <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fechaActa"
                  type="date"
                  {...register("fechaActa")}
                  className={errors.fechaActa ? "border-red-500" : ""}
                />
                {errors.fechaActa && (
                  <p className="text-xs text-red-500">
                    {errors.fechaActa.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profesor y Destino */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profesor y Destino
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Profesor */}
              <div className="space-y-2">
                <Label htmlFor="profesorId">
                  Profesor <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={watch("profesorId")}
                  onValueChange={(value) => setValue("profesorId", value)}
                >
                  <SelectTrigger
                    className={errors.profesorId ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Seleccione un profesor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {profesores.map((profesor) => (
                      <SelectItem key={profesor.id} value={profesor.id}>
                        {profesor.nombre} {profesor.apellidos} - {profesor.ci}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.profesorId && (
                  <p className="text-xs text-red-500">
                    {errors.profesorId.message}
                  </p>
                )}
              </div>

              {/* País Destino */}
              <div className="space-y-2">
                <Label htmlFor="paisDestinoId">
                  País de Destino <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={watch("paisDestinoId")}
                  onValueChange={(value) => setValue("paisDestinoId", value)}
                >
                  <SelectTrigger
                    className={errors.paisDestinoId ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Seleccione un país..." />
                  </SelectTrigger>
                  <SelectContent>
                    {paises.map((pais) => (
                      <SelectItem key={pais.id} value={pais.id}>
                        {pais.nombreEs}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.paisDestinoId && (
                  <p className="text-xs text-red-500">
                    {errors.paisDestinoId.message}
                  </p>
                )}
              </div>
            </div>

            {/* Función */}
            <div className="space-y-2">
              <Label htmlFor="funcion">
                Función a Desempeñar <span className="text-red-500">*</span>
              </Label>
              <Input
                id="funcion"
                {...register("funcion")}
                placeholder="PROFESOR DE MATEMATICAS"
                className={errors.funcion ? "border-red-500" : ""}
              />
              {errors.funcion && (
                <p className="text-xs text-red-500">{errors.funcion.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Observaciones */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Observaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones Adicionales</Label>
              <Textarea
                id="observaciones"
                {...register("observaciones")}
                placeholder="Observaciones adicionales sobre el acta..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button - Mobile */}
        <div className="flex justify-end lg:hidden">
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
            className="glass-button w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  );
}

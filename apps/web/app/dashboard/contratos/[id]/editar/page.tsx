"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Save,
  ArrowLeft,
  FileText,
  Calendar,
  DollarSign,
  Loader2,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { contratosService } from "@/services/contratos.service";
import { nomencladoresService } from "@/services/nomencladores.service";
import { NotificationService } from "@/services/notification.service";
import { Contrato, Pais, Profesor, EstadoContrato } from "@/types";
import { profesoresService } from "@/services/profesores.service";

// Validation schema - matches backend DTO requirements
const contratoSchema = z.object({
  numeroConsecutivo: z.coerce.number().min(1, "El número es requerido"),
  ano: z.coerce.number().min(2020, "Año inválido").max(2100, "Año inválido"),
  profesorId: z.coerce.string().min(1, "El profesor es requerido"),
  paisId: z.coerce.string().min(1, "El país es requerido"),
  fechaInicio: z.coerce.string().min(1, "La fecha de inicio es requerida"),
  fechaFin: z.coerce.string().min(1, "La fecha de fin es requerida"),
  fechaFirma: z.coerce.string().optional().nullable(),
  // These are REQUIRED by backend DTO
  funcion: z.coerce.string().min(1, "La función es requerida"),
  centroTrabajo: z.coerce.string().min(1, "El centro de trabajo es requerido"),
  // These are optional
  direccionTrabajo: z.coerce.string().optional().nullable(),
  salarioMensual: z.coerce.string().optional().nullable(),
  moneda: z.coerce.string().optional().nullable(),
  estado: z.enum(["ACTIVO", "PRORROGADO", "CERRADO", "CANCELADO"]),
  observaciones: z.coerce.string().optional().nullable(),
});

type ContratoFormData = z.infer<typeof contratoSchema>;

export default function EditarContratoPage() {
  const router = useRouter();
  const params = useParams();
  const contratoId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [contrato, setContrato] = useState<Contrato | null>(null);

  // Nomencladores
  const [paises, setPaises] = useState<Pais[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ContratoFormData>({
    resolver: zodResolver(contratoSchema),
  });

  // Load contrato and nomencladores
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsDataLoading(true);
        const [contratoData, paisesData, profesoresData] = await Promise.all([
          contratosService.getById(contratoId),
          nomencladoresService.getPaises(),
          profesoresService.getAll({ limit: 1000 }).then((r) => r.data),
        ]);

        setContrato(contratoData);
        setPaises(paisesData);
        setProfesores(profesoresData);

        // Set form values - use empty string for required fields that might be null
        reset({
          numeroConsecutivo: contratoData.numeroConsecutivo,
          ano: contratoData.ano,
          profesorId: contratoData.profesorId,
          paisId: contratoData.paisId,
          fechaInicio: contratoData.fechaInicio?.split("T")[0],
          fechaFin: contratoData.fechaFin?.split("T")[0],
          fechaFirma: contratoData.fechaFirma?.split("T")[0] || null,
          // These are required by backend, use empty string if null
          funcion: contratoData.funcion || "",
          centroTrabajo: contratoData.centroTrabajo || "",
          direccionTrabajo: contratoData.direccionTrabajo || null,
          salarioMensual: contratoData.salarioMensual || null,
          moneda: contratoData.moneda || null,
          estado: contratoData.estado,
          observaciones: contratoData.observaciones || null,
        });
      } catch (error) {
        NotificationService.error("Error al cargar datos del contrato");
        router.push("/dashboard/contratos");
      } finally {
        setIsDataLoading(false);
      }
    };

    if (contratoId) {
      loadData();
    }
  }, [contratoId, reset, router]);

  const onSubmit = async (data: ContratoFormData) => {
    setIsLoading(true);
    const loadingToast = NotificationService.loading(
      "Actualizando contrato...",
    );

    try {
      // Clean data: Only send fields allowed by UpdateContratoDto
      // numeroConsecutivo, ano, estado are NOT allowed in update
      const apiData: any = {
        profesorId: data.profesorId,
        paisId: data.paisId,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        // These are REQUIRED by backend DTO - always include them
        funcion: data.funcion,
        centroTrabajo: data.centroTrabajo,
      };

      // Add optional fields only if they have values
      if (data.fechaFirma) apiData.fechaFirma = data.fechaFirma;
      if (data.direccionTrabajo)
        apiData.direccionTrabajo = data.direccionTrabajo;
      if (data.salarioMensual !== null && data.salarioMensual !== undefined) {
        apiData.salarioMensual = data.salarioMensual.toString();
      }
      if (data.moneda) apiData.moneda = data.moneda;
      if (data.observaciones) apiData.observaciones = data.observaciones;

      await contratosService.update(contratoId, apiData);

      NotificationService.update(
        loadingToast,
        "Contrato actualizado exitosamente",
        "success",
      );

      await NotificationService.successDialog(
        "Actualización Exitosa",
        `El contrato ha sido actualizado correctamente.`,
      );

      router.push("/dashboard/contratos");
    } catch (error: any) {
      NotificationService.update(loadingToast, "Error al actualizar", "error");
      await NotificationService.errorDialog(
        "Error",
        error.message ||
          "No se pudo actualizar el contrato. Verifique los datos e intente nuevamente.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Manual submit handler
  const handleManualSubmit = async () => {
    const currentData = watch();

    try {
      const validatedData = contratoSchema.parse(currentData);
      await onSubmit(validatedData);
    } catch (error: any) {
      if (error.errors) {
        NotificationService.error(
          `Error de validación: ${error.errors[0].message}`,
        );
      } else {
        NotificationService.error("Error de validación en el formulario");
      }
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
            onClick={() => router.push("/dashboard/contratos")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Editar Contrato
            </h2>
            <p className="text-muted-foreground">
              Modifique los datos del contrato {contrato?.numeroConsecutivo}/
              {contrato?.ano}
            </p>
          </div>
        </div>
        <Button
          onClick={handleManualSubmit}
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
      <form id="edit-contrato-form">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="glass-card grid w-full grid-cols-3 lg:w-[500px]">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="fechas" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Fechas</span>
            </TabsTrigger>
            <TabsTrigger value="salario" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Salario</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: General */}
          <TabsContent value="general">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Número Consecutivo */}
                  <div className="space-y-2">
                    <Label htmlFor="numeroConsecutivo">
                      Número Consecutivo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="numeroConsecutivo"
                      {...register("numeroConsecutivo")}
                      placeholder="123"
                      className={
                        errors.numeroConsecutivo ? "border-red-500" : ""
                      }
                    />
                    {errors.numeroConsecutivo && (
                      <p className="text-xs text-red-500">
                        {errors.numeroConsecutivo.message}
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
                      <p className="text-xs text-red-500">
                        {errors.ano.message}
                      </p>
                    )}
                  </div>
                </div>

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
                        <SelectValue placeholder="Seleccione profesor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {profesores.map((profesor) => (
                          <SelectItem key={profesor.id} value={profesor.id}>
                            {profesor.nombre} {profesor.apellidos} (
                            {profesor.ci})
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

                  {/* País */}
                  <div className="space-y-2">
                    <Label htmlFor="paisId">
                      País <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch("paisId")}
                      onValueChange={(value) => setValue("paisId", value)}
                    >
                      <SelectTrigger
                        className={errors.paisId ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Seleccione país..." />
                      </SelectTrigger>
                      <SelectContent>
                        {paises.map((pais) => (
                          <SelectItem key={pais.id} value={pais.id}>
                            {pais.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.paisId && (
                      <p className="text-xs text-red-500">
                        {errors.paisId.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Estado */}
                  <div className="space-y-2">
                    <Label htmlFor="estado">
                      Estado <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch("estado")}
                      onValueChange={(value) =>
                        setValue("estado", value as EstadoContrato)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione estado..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVO">Activo</SelectItem>
                        <SelectItem value="PRORROGADO">Prorrogado</SelectItem>
                        <SelectItem value="CERRADO">Cerrado</SelectItem>
                        <SelectItem value="CANCELADO">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Función */}
                  <div className="space-y-2">
                    <Label htmlFor="funcion">
                      Función <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="funcion"
                      {...register("funcion")}
                      placeholder="Profesor de Matemáticas"
                      className={errors.funcion ? "border-red-500" : ""}
                    />
                    {errors.funcion && (
                      <p className="text-xs text-red-500">
                        {errors.funcion.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Fechas */}
          <TabsContent value="fechas">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Fechas del Contrato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Fecha Inicio */}
                  <div className="space-y-2">
                    <Label htmlFor="fechaInicio">
                      Fecha de Inicio <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fechaInicio"
                      type="date"
                      {...register("fechaInicio")}
                      className={errors.fechaInicio ? "border-red-500" : ""}
                    />
                    {errors.fechaInicio && (
                      <p className="text-xs text-red-500">
                        {errors.fechaInicio.message}
                      </p>
                    )}
                  </div>

                  {/* Fecha Fin */}
                  <div className="space-y-2">
                    <Label htmlFor="fechaFin">
                      Fecha de Fin <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fechaFin"
                      type="date"
                      {...register("fechaFin")}
                      className={errors.fechaFin ? "border-red-500" : ""}
                    />
                    {errors.fechaFin && (
                      <p className="text-xs text-red-500">
                        {errors.fechaFin.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaFirma">Fecha de Firma</Label>
                  <Input
                    id="fechaFirma"
                    type="date"
                    {...register("fechaFirma")}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Salario y Ubicación */}
          <TabsContent value="salario">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Salario y Centro de Trabajo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Centro de Trabajo */}
                  <div className="space-y-2">
                    <Label htmlFor="centroTrabajo">
                      Centro de Trabajo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="centroTrabajo"
                      {...register("centroTrabajo")}
                      placeholder="Escuela Primaria XYZ"
                      className={errors.centroTrabajo ? "border-red-500" : ""}
                    />
                    {errors.centroTrabajo && (
                      <p className="text-xs text-red-500">
                        {errors.centroTrabajo.message}
                      </p>
                    )}
                  </div>

                  {/* Dirección de Trabajo */}
                  <div className="space-y-2">
                    <Label htmlFor="direccionTrabajo">
                      Dirección del Trabajo
                    </Label>
                    <Input
                      id="direccionTrabajo"
                      {...register("direccionTrabajo")}
                      placeholder="Calle 123, Ciudad"
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Salario */}
                  <div className="space-y-2">
                    <Label htmlFor="salarioMensual">Salario Mensual</Label>
                    <Input
                      id="salarioMensual"
                      type="number"
                      step="0.01"
                      {...register("salarioMensual")}
                      placeholder="1500.00"
                    />
                  </div>

                  {/* Moneda */}
                  <div className="space-y-2">
                    <Label htmlFor="moneda">Moneda</Label>
                    <Select
                      value={watch("moneda") || undefined}
                      onValueChange={(value) => setValue("moneda", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione moneda..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CUP">CUP (Peso Cubano)</SelectItem>
                        <SelectItem value="USD">USD (Dólar)</SelectItem>
                        <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    {...register("observaciones")}
                    placeholder="Observaciones adicionales sobre el contrato..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button - Mobile */}
        <div className="mt-6 flex justify-end lg:hidden">
          <Button
            onClick={handleManualSubmit}
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

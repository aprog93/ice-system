"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Save,
  ArrowLeft,
  BookUser,
  FileText,
  Info,
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
import { pasaportesService } from "@/services/pasaportes.service";
import { profesoresService } from "@/services/profesores.service";
import { NotificationService } from "@/services/notification.service";
import { Pasaporte, Profesor } from "@/types";

// Validation schema - matches backend DTO
const pasaporteSchema = z
  .object({
    profesorId: z.string().min(1, "El profesor es requerido"),
    tipo: z.enum(["ORDINARIO", "OFICIAL", "DIPLOMATICO"], {
      errorMap: () => ({ message: "El tipo de pasaporte es requerido" }),
    }),
    numero: z
      .string()
      .min(1, "El número de pasaporte es requerido")
      .regex(
        /^[A-Z]\d{6}$/,
        "El número debe tener el formato: letra + 6 números (ej: A123456)",
      ),
    fechaExpedicion: z.string().min(1, "La fecha de expedición es requerida"),
    fechaVencimiento: z.string().min(1, "La fecha de vencimiento es requerida"),
    lugarExpedicion: z.string().optional().nullable(),
    observaciones: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.fechaExpedicion || !data.fechaVencimiento) return true;
      return new Date(data.fechaVencimiento) > new Date(data.fechaExpedicion);
    },
    {
      message:
        "La fecha de vencimiento debe ser posterior a la fecha de expedición",
      path: ["fechaVencimiento"],
    },
  );

type PasaporteFormData = z.infer<typeof pasaporteSchema>;

export default function EditarPasaportePage() {
  const router = useRouter();
  const params = useParams();
  const pasaporteId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [pasaporte, setPasaporte] = useState<Pasaporte | null>(null);

  // Data
  const [profesores, setProfesores] = useState<Profesor[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PasaporteFormData>({
    resolver: zodResolver(pasaporteSchema),
  });

  // Load pasaporte and profesores
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsDataLoading(true);
        const [pasaporteData, profesoresResponse] = await Promise.all([
          pasaportesService.getById(pasaporteId),
          profesoresService.getAll({ limit: 1000 }),
        ]);

        setPasaporte(pasaporteData);
        setProfesores(profesoresResponse.data);

        // Set form values
        reset({
          profesorId: pasaporteData.profesorId,
          tipo: pasaporteData.tipo,
          numero: pasaporteData.numero,
          fechaExpedicion: pasaporteData.fechaExpedicion?.split("T")[0],
          fechaVencimiento: pasaporteData.fechaVencimiento?.split("T")[0],
          lugarExpedicion: pasaporteData.lugarExpedicion || null,
          observaciones: pasaporteData.observaciones || null,
        });
      } catch (error) {
        NotificationService.error("Error al cargar datos del pasaporte");
        router.push("/dashboard/tramites");
      } finally {
        setIsDataLoading(false);
      }
    };

    if (pasaporteId) {
      loadData();
    }
  }, [pasaporteId, reset, router]);

  const onSubmit = async (data: PasaporteFormData) => {
    setIsLoading(true);
    const loadingToast = NotificationService.loading(
      "Actualizando pasaporte...",
    );

    try {
      await pasaportesService.update(pasaporteId, {
        profesorId: data.profesorId,
        tipo: data.tipo,
        numero: data.numero.toUpperCase(),
        fechaExpedicion: data.fechaExpedicion,
        fechaVencimiento: data.fechaVencimiento,
        lugarExpedicion: data.lugarExpedicion || undefined,
        observaciones: data.observaciones || undefined,
      });

      NotificationService.update(
        loadingToast,
        "Pasaporte actualizado exitosamente",
        "success",
      );

      await NotificationService.successDialog(
        "Actualización Exitosa",
        `El pasaporte ${data.numero.toUpperCase()} ha sido actualizado correctamente.`,
      );

      router.push("/dashboard/tramites");
    } catch (error: any) {
      NotificationService.update(loadingToast, "Error al actualizar", "error");
      await NotificationService.errorDialog(
        "Error",
        error.message ||
          "No se pudo actualizar el pasaporte. Verifique los datos e intente nuevamente.",
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/tramites")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Editar Pasaporte
            </h2>
            <p className="text-muted-foreground">
              {pasaporte.numero} - {pasaporte.profesor?.nombre}{" "}
              {pasaporte.profesor?.apellidos}
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="glass-card grid w-full grid-cols-2 lg:w-[300px]">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <BookUser className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="detalles" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Detalles</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: General */}
          <TabsContent value="general">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookUser className="h-5 w-5" />
                  Información del Pasaporte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                      {profesores.length === 0 ? (
                        <SelectItem value="" disabled>
                          No hay profesores disponibles
                        </SelectItem>
                      ) : (
                        profesores.map((profesor) => (
                          <SelectItem key={profesor.id} value={profesor.id}>
                            {profesor.nombre} {profesor.apellidos} -{" "}
                            {profesor.ci}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.profesorId && (
                    <p className="text-xs text-red-500">
                      {errors.profesorId.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Tipo de Pasaporte */}
                  <div className="space-y-2">
                    <Label htmlFor="tipo">
                      Tipo de Pasaporte <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch("tipo")}
                      onValueChange={(
                        value: "ORDINARIO" | "OFICIAL" | "DIPLOMATICO",
                      ) => setValue("tipo", value)}
                    >
                      <SelectTrigger
                        className={errors.tipo ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Seleccione tipo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ORDINARIO">Ordinario</SelectItem>
                        <SelectItem value="OFICIAL">Oficial</SelectItem>
                        <SelectItem value="DIPLOMATICO">Diplomático</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.tipo && (
                      <p className="text-xs text-red-500">
                        {errors.tipo.message}
                      </p>
                    )}
                  </div>

                  {/* Número de Pasaporte */}
                  <div className="space-y-2">
                    <Label htmlFor="numero">
                      Número <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="numero"
                      {...register("numero")}
                      placeholder="A123456"
                      className={errors.numero ? "border-red-500" : ""}
                      onChange={(e) => {
                        // Auto-uppercase
                        e.target.value = e.target.value.toUpperCase();
                        register("numero").onChange(e);
                      }}
                    />
                    {errors.numero ? (
                      <p className="text-xs text-red-500">
                        {errors.numero.message}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Formato: letra mayúscula + 6 números
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Fecha de Expedición */}
                  <div className="space-y-2">
                    <Label htmlFor="fechaExpedicion">
                      Fecha de Expedición{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fechaExpedicion"
                      type="date"
                      {...register("fechaExpedicion")}
                      className={errors.fechaExpedicion ? "border-red-500" : ""}
                    />
                    {errors.fechaExpedicion && (
                      <p className="text-xs text-red-500">
                        {errors.fechaExpedicion.message}
                      </p>
                    )}
                  </div>

                  {/* Fecha de Vencimiento */}
                  <div className="space-y-2">
                    <Label htmlFor="fechaVencimiento">
                      Fecha de Vencimiento{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fechaVencimiento"
                      type="date"
                      {...register("fechaVencimiento")}
                      className={
                        errors.fechaVencimiento ? "border-red-500" : ""
                      }
                    />
                    {errors.fechaVencimiento && (
                      <p className="text-xs text-red-500">
                        {errors.fechaVencimiento.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Detalles */}
          <TabsContent value="detalles">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Información Adicional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Lugar de Expedición */}
                <div className="space-y-2">
                  <Label htmlFor="lugarExpedicion">Lugar de Expedición</Label>
                  <Input
                    id="lugarExpedicion"
                    {...register("lugarExpedicion")}
                    placeholder="Habana, Cuba"
                  />
                </div>

                {/* Observaciones */}
                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    {...register("observaciones")}
                    placeholder="Observaciones adicionales sobre el pasaporte..."
                    rows={4}
                  />
                </div>

                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Información Importante
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Los cambios en las fechas afectarán las alertas de
                        vencimiento. Asegúrese de que las fechas sean correctas
                        para recibir notificaciones oportunas.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button - Mobile */}
        <div className="mt-6 flex justify-end lg:hidden">
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Save,
  ArrowLeft,
  Briefcase,
  User,
  DollarSign,
  MapPin,
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
import { profesoresService } from "@/services/profesores.service";
import { nomencladoresService } from "@/services/nomencladores.service";
import { NotificationService } from "@/services/notification.service";
import { Profesor, Pais } from "@/types";

// Validation schema
const contratoSchema = z
  .object({
    profesorId: z.string().min(1, "El profesor es requerido"),
    paisId: z.string().min(1, "El país es requerido"),
    fechaInicio: z.string().min(1, "La fecha de inicio es requerida"),
    fechaFin: z.string().min(1, "La fecha de fin es requerida"),
    funcion: z.string().min(1, "La función es requerida"),
    centroTrabajo: z.string().min(1, "El centro de trabajo es requerido"),
    direccionTrabajo: z.string().optional(),
    salarioMensual: z.string().optional(),
    moneda: z.string().default("USD"),
    observaciones: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.fechaInicio || !data.fechaFin) return true;
      return new Date(data.fechaFin) > new Date(data.fechaInicio);
    },
    {
      message: "La fecha de fin debe ser posterior a la fecha de inicio",
      path: ["fechaFin"],
    },
  );

type ContratoFormData = z.infer<typeof contratoSchema>;

export default function NuevoContratoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Data
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [paises, setPaises] = useState<Pais[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContratoFormData>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      moneda: "USD",
      fechaInicio: format(new Date(), "yyyy-MM-dd"),
    },
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsDataLoading(true);
        const [profesoresResponse, paisesData] = await Promise.all([
          profesoresService.getAll({ limit: 1000 }),
          nomencladoresService.getPaises(),
        ]);

        // Filter only active profesores
        const activeProfesores = profesoresResponse.data.filter(
          (p) =>
            p.estadoPotencial === "ACTIVO" ||
            p.estadoPotencial === "EN_PROCESO",
        );

        setProfesores(activeProfesores);
        setPaises(paisesData);
      } catch (error) {
        NotificationService.error("Error al cargar datos");
      } finally {
        setIsDataLoading(false);
      }
    };

    loadData();
  }, []);

  const onSubmit = async (data: ContratoFormData) => {
    setIsLoading(true);
    const loadingToast = NotificationService.loading("Guardando contrato...");

    try {
      await contratosService.create(data);

      NotificationService.update(
        loadingToast,
        "Contrato creado exitosamente",
        "success",
      );

      await NotificationService.successDialog(
        "Registro Exitoso",
        `El contrato ha sido registrado correctamente.`,
      );

      router.push("/dashboard/contratos");
    } catch (error: any) {
      NotificationService.update(loadingToast, "Error al guardar", "error");
      await NotificationService.errorDialog(
        "Error",
        error.message ||
          "No se pudo guardar el contrato. Verifique los datos e intente nuevamente.",
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
            onClick={() => router.push("/dashboard/contratos")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Nuevo Contrato
            </h2>
            <p className="text-muted-foreground">
              Registre un nuevo contrato de colaboración
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
          Guardar Contrato
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="glass-card grid w-full grid-cols-3 lg:w-[450px]">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="ubicacion" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Ubicación</span>
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
                  <User className="h-5 w-5" />
                  Información General
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
                          No hay profesores activos disponibles
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

                {/* País */}
                <div className="space-y-2">
                  <Label htmlFor="paisId">
                    País de Destino <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={watch("paisId")}
                    onValueChange={(value) => setValue("paisId", value)}
                  >
                    <SelectTrigger
                      className={errors.paisId ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Seleccione un país..." />
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

                {/* Función */}
                <div className="space-y-2">
                  <Label htmlFor="funcion">
                    Función / Cargo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="funcion"
                    {...register("funcion")}
                    placeholder="Profesor de Matemática"
                    className={errors.funcion ? "border-red-500" : ""}
                  />
                  {errors.funcion && (
                    <p className="text-xs text-red-500">
                      {errors.funcion.message}
                    </p>
                  )}
                </div>

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

                {/* Observaciones */}
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

          {/* Tab: Ubicación */}
          <TabsContent value="ubicacion">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Centro de Trabajo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Centro de Trabajo */}
                <div className="space-y-2">
                  <Label htmlFor="centroTrabajo">
                    Centro de Trabajo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="centroTrabajo"
                    {...register("centroTrabajo")}
                    placeholder="Universidad Nacional de..."
                    className={errors.centroTrabajo ? "border-red-500" : ""}
                  />
                  {errors.centroTrabajo && (
                    <p className="text-xs text-red-500">
                      {errors.centroTrabajo.message}
                    </p>
                  )}
                </div>

                {/* Dirección del Trabajo */}
                <div className="space-y-2">
                  <Label htmlFor="direccionTrabajo">
                    Dirección del Centro de Trabajo
                  </Label>
                  <Textarea
                    id="direccionTrabajo"
                    {...register("direccionTrabajo")}
                    placeholder="Dirección completa del centro de trabajo..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Salario */}
          <TabsContent value="salario">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Información Salarial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Salario Mensual */}
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
                      value={watch("moneda")}
                      onValueChange={(value) => setValue("moneda", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione moneda..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">
                          USD - Dólar Estadounidense
                        </SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">
                          GBP - Libra Esterlina
                        </SelectItem>
                        <SelectItem value="CNY">CNY - Yuan Chino</SelectItem>
                        <SelectItem value="VES">
                          VES - Bolívar Venezolano
                        </SelectItem>
                        <SelectItem value="BOB">BOB - Boliviano</SelectItem>
                        <SelectItem value="OTHER">Otra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Nota:</strong> El salario mensual es opcional. Si no
                    se especifica, se puede completar posteriormente en la
                    edición del contrato.
                  </p>
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
            Guardar Contrato
          </Button>
        </div>
      </form>
    </div>
  );
}

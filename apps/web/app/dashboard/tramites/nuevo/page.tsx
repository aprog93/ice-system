"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addYears } from "date-fns";
import {
  Save,
  ArrowLeft,
  BookUser,
  FileText,
  Info,
  Loader2,
  Search,
  User,
  Hash,
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
import { Profesor } from "@/types";

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
    lugarExpedicion: z.string().optional(),
    observaciones: z.string().optional(),
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

export default function NuevoPasaportePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Data
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfesor, setSelectedProfesor] = useState<Profesor | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PasaporteFormData>({
    resolver: zodResolver(pasaporteSchema),
    defaultValues: {
      tipo: "ORDINARIO",
      fechaExpedicion: format(new Date(), "yyyy-MM-dd"),
      fechaVencimiento: format(addYears(new Date(), 10), "yyyy-MM-dd"),
    },
  });

  const tipo = watch("tipo");

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsDataLoading(true);
        const profesoresResponse = await profesoresService.getAll({
          limit: 1000,
        });

        // Filter only active profesores
        const activeProfesores = profesoresResponse.data.filter(
          (p) =>
            p.estadoPotencial === "ACTIVO" ||
            p.estadoPotencial === "EN_PROCESO",
        );

        setProfesores(activeProfesores);
      } catch (error) {
        NotificationService.error("Error al cargar datos");
      } finally {
        setIsDataLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter profesores based on search term (case-insensitive)
  const filteredProfesores = useMemo(() => {
    if (!searchTerm.trim()) return profesores;

    const search = searchTerm.toLowerCase();
    return profesores.filter((profesor) => {
      const fullName = `${profesor.nombre} ${profesor.apellidos}`.toLowerCase();
      const ci = profesor.ci.toLowerCase();
      return fullName.includes(search) || ci.includes(search);
    });
  }, [profesores, searchTerm]);

  // Generate automatic passport number when profesor or tipo changes
  useEffect(() => {
    if (selectedProfesor && tipo) {
      const letraTipo =
        tipo === "ORDINARIO" ? "P" : tipo === "OFICIAL" ? "O" : "D";
      const timestamp = Date.now().toString().slice(-5);
      const numeroGenerado = `${letraTipo}${timestamp}`.padEnd(7, "0");
      setValue("numero", numeroGenerado.slice(0, 7));
    }
  }, [selectedProfesor, tipo, setValue]);

  const onSubmit = async (data: PasaporteFormData) => {
    console.log("📝 onSubmit called with data:", data);
    setIsLoading(true);
    const loadingToast = NotificationService.loading("Guardando pasaporte...");

    try {
      await pasaportesService.create({
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
        "Pasaporte creado exitosamente",
        "success",
      );

      await NotificationService.successDialog(
        "Registro Exitoso",
        `El pasaporte ${data.numero.toUpperCase()} ha sido registrado correctamente.`,
      );

      router.push("/dashboard/pasaportes");
    } catch (error: any) {
      console.error("❌ Error creating pasaporte:", error);
      NotificationService.update(loadingToast, "Error al guardar", "error");
      await NotificationService.errorDialog(
        "Error",
        error.message ||
          "No se pudo guardar el pasaporte. Verifique los datos e intente nuevamente.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfesorSelect = (profesorId: string) => {
    setValue("profesorId", profesorId);
    const profesor = profesores.find((p) => p.id === profesorId);
    setSelectedProfesor(profesor || null);
    if (profesor) {
      setSearchTerm(
        `${profesor.nombre} ${profesor.apellidos} - ${profesor.ci}`,
      );
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
            onClick={() => router.push("/dashboard/pasaportes")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Nuevo Pasaporte
            </h2>
            <p className="text-muted-foreground">
              Registre un nuevo pasaporte para un profesor
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isLoading}
          className="glass-button"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar Pasaporte
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                {/* Buscador de Profesor */}
                <div className="space-y-2">
                  <Label htmlFor="profesorSearch">
                    Buscar Profesor <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="profesorSearch"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (!e.target.value) {
                          setSelectedProfesor(null);
                          setValue("profesorId", "");
                        }
                      }}
                      placeholder="Escriba nombre o CI del profesor..."
                      className="pl-10"
                    />
                  </div>

                  {/* Lista de profesores filtrados */}
                  {searchTerm &&
                    filteredProfesores.length > 0 &&
                    !selectedProfesor && (
                      <div className="mt-2 border rounded-md max-h-48 overflow-y-auto bg-white dark:bg-gray-800 shadow-lg">
                        {filteredProfesores.map((profesor) => (
                          <button
                            key={profesor.id}
                            type="button"
                            onClick={() => handleProfesorSelect(profesor.id)}
                            className="w-full px-4 py-3 text-left hover:bg-muted/50 border-b last:border-b-0 flex items-center gap-3"
                          >
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {profesor.nombre} {profesor.apellidos}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                CI: {profesor.ci}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                  {searchTerm &&
                    filteredProfesores.length === 0 &&
                    !selectedProfesor && (
                      <p className="text-sm text-muted-foreground mt-2">
                        No se encontraron profesores con ese criterio
                      </p>
                    )}

                  {/* Profesor seleccionado */}
                  {selectedProfesor && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full">
                          <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {selectedProfesor.nombre}{" "}
                            {selectedProfesor.apellidos}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            CI: {selectedProfesor.ci}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProfesor(null);
                          setValue("profesorId", "");
                          setSearchTerm("");
                        }}
                      >
                        Cambiar
                      </Button>
                    </div>
                  )}

                  <input type="hidden" {...register("profesorId")} />
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

                  {/* Número de Pasaporte - Auto generado */}
                  <div className="space-y-2">
                    <Label htmlFor="numero">
                      Número <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="numero"
                        {...register("numero")}
                        placeholder="P123456"
                        className={`pl-10 ${errors.numero ? "border-red-500" : ""}`}
                        readOnly={!!selectedProfesor}
                      />
                    </div>
                    {errors.numero ? (
                      <p className="text-xs text-red-500">
                        {errors.numero.message}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Generado automáticamente al seleccionar profesor y tipo
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
                        Los pasaportes ordinarios tienen una vigencia de 10
                        años. Asegúrese de registrar correctamente las fechas
                        para recibir alertas de vencimiento.
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
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
            className="glass-button w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar Pasaporte
          </Button>
        </div>
      </form>
    </div>
  );
}

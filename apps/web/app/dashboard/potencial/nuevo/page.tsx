"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Save,
  ArrowLeft,
  User,
  MapPin,
  GraduationCap,
  Contact,
  Loader2,
  Info,
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
import { profesoresService } from "@/services/profesores.service";
import { nomencladoresService } from "@/services/nomencladores.service";
import { NotificationService } from "@/services/notification.service";
import {
  Provincia,
  Municipio,
  Cargo,
  Especialidad,
  CategoriaDocente,
  Pais,
  Sexo,
  EstadoCivil,
  NivelIngles,
  EstadoPotencial,
} from "@/types";

// Validation schema
const profesorSchema = z.object({
  ci: z
    .string()
    .min(11, "El CI debe tener 11 caracteres")
    .max(11, "El CI debe tener 11 caracteres"),
  nombre: z.string().min(1, "El nombre es requerido"),
  apellidos: z.string().min(1, "Los apellidos son requeridos"),
  edad: z.coerce
    .number()
    .min(18, "La edad mínima es 18 años")
    .max(80, "La edad máxima es 80 años")
    .optional(),
  sexo: z.enum(["MASCULINO", "FEMENINO"]).optional(),
  colorPiel: z.string().optional(),
  colorOjos: z.string().optional(),
  colorPelo: z.string().optional(),
  estatura: z.coerce.number().optional(),
  peso: z.coerce.number().optional(),
  senasParticulares: z.string().optional(),
  direccion: z.string().optional(),
  provinciaId: z.string().optional(),
  municipioId: z.string().optional(),
  cargoId: z.string().optional(),
  especialidadId: z.string().optional(),
  categoriaDocenteId: z.string().optional(),
  anosExperiencia: z.coerce.number().min(0, "No puede ser negativo").optional(),
  estadoCivil: z
    .enum(["SOLTERO", "CASADO", "DIVORCIADO", "VIUDO", "UNION_ESTABLE"])
    .optional(),
  cantidadHijos: z.coerce.number().min(0, "No puede ser negativo").optional(),
  telefonoFijo: z.string().optional(),
  telefonoMovil: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  nivelIngles: z
    .enum(["BASICO", "INTERMEDIO", "AVANZADO", "NATIVO"])
    .optional(),
  anoGraduado: z.coerce.number().optional(),
  centroGraduacion: z.string().optional(),
  notaPromedio: z.coerce.number().min(0).max(5).optional(),
  estadoPotencial: z
    .enum(["ACTIVO", "EN_PROCESO", "CONTRATADO", "BAJA", "SUSPENDIDO"])
    .optional(),
  observaciones: z.string().optional(),
  nombrePadre: z.string().optional(),
  nombreMadre: z.string().optional(),
  conyuge: z.string().optional(),
  militanciaPCC: z.boolean().optional(),
  militanciaUJC: z.boolean().optional(),
  accionColaboracion: z.string().optional(),
  familiarAvisoNombre: z.string().optional(),
  familiarAvisoTelefono: z.string().optional(),
  // Campos X-22 (Formulario de Solicitud de Pasaporte)
  fechaNacimiento: z.string().optional(),
  paisNacimientoId: z.string().optional(),
  ciudadEnElExtranjero: z.string().optional(),
  calle: z.string().optional(),
  numero: z.string().optional(),
  entreCalles: z.string().optional(),
  apto: z.string().optional(),
  cpa: z.string().optional(),
  finca: z.string().optional(),
  localidad: z.string().optional(),
  circunscripcion: z.string().optional(),
  carretera: z.string().optional(),
  km: z.string().optional(),
});

type ProfesorFormData = z.infer<typeof profesorSchema>;

export default function NuevoProfesorPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Nomencladores
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [municipiosFiltrados, setMunicipiosFiltrados] = useState<Municipio[]>(
    [],
  );
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [categoriasDocentes, setCategoriasDocentes] = useState<
    CategoriaDocente[]
  >([]);
  const [paises, setPaises] = useState<Pais[]>([]);
  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfesorFormData>({
    resolver: zodResolver(profesorSchema),
    defaultValues: {
      estadoPotencial: "ACTIVO",
      sexo: "MASCULINO",
      estadoCivil: "SOLTERO",
      nivelIngles: "BASICO",
      cantidadHijos: 0,
      anosExperiencia: 0,
      militanciaPCC: false,
      militanciaUJC: false,
    },
  });

  const provinciaId = watch("provinciaId");
  const fechaNacimiento = watch("fechaNacimiento");

  // Calcular edad automáticamente cuando cambia la fecha de nacimiento
  useEffect(() => {
    if (fechaNacimiento) {
      const birthDate = new Date(fechaNacimiento);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      // Ajustar si no ha cumplido años este año
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      if (age >= 0 && age <= 120) {
        setValue("edad", age);
      }
    }
  }, [fechaNacimiento, setValue]);

  // Load nomencladores
  useEffect(() => {
    const loadNomencladores = async () => {
      try {
        setIsDataLoading(true);
        const [
          provinciasData,
          cargosData,
          especialidadesData,
          categoriasData,
          paisesData,
        ] = await Promise.all([
          nomencladoresService.getProvincias(),
          nomencladoresService.getCargos(),
          nomencladoresService.getEspecialidades(),
          nomencladoresService.getCategoriasDocentes(),
          nomencladoresService.getPaises(),
        ]);

        setProvincias(provinciasData);
        setCargos(cargosData);
        setEspecialidades(especialidadesData);
        setCategoriasDocentes(categoriasData);
        setPaises(paisesData);
      } catch (error) {
        NotificationService.error("Error al cargar datos de nomencladores");
      } finally {
        setIsDataLoading(false);
      }
    };

    loadNomencladores();
  }, []);

  // Load municipios when provincia changes
  useEffect(() => {
    const loadMunicipios = async () => {
      if (!provinciaId) {
        setMunicipiosFiltrados([]);
        setValue("municipioId", "");
        return;
      }

      try {
        setIsLoadingMunicipios(true);
        const municipiosData =
          await nomencladoresService.getMunicipios(provinciaId);
        setMunicipiosFiltrados(municipiosData);
        // Reset municipio selection when provincia changes
        setValue("municipioId", "");
      } catch (error) {
        NotificationService.error("Error al cargar municipios");
        setMunicipiosFiltrados([]);
      } finally {
        setIsLoadingMunicipios(false);
      }
    };

    loadMunicipios();
  }, [provinciaId, setValue]);

  const onSubmit = async (data: ProfesorFormData) => {
    setIsLoading(true);
    const loadingToast = NotificationService.loading("Guardando profesor...");

    try {
      await profesoresService.create(data);

      NotificationService.update(
        loadingToast,
        "Profesor creado exitosamente",
        "success",
      );

      await NotificationService.successDialog(
        "Registro Exitoso",
        `El profesor <strong>${data.nombre} ${data.apellidos}</strong> ha sido registrado correctamente.`,
      );

      router.push("/dashboard/potencial");
    } catch (error: any) {
      NotificationService.update(loadingToast, "Error al guardar", "error");
      await NotificationService.errorDialog(
        "Error",
        error.message ||
          "No se pudo guardar el profesor. Verifique los datos e intente nuevamente.",
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
            onClick={() => router.push("/dashboard/potencial")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Nuevo Profesor
            </h2>
            <p className="text-muted-foreground">
              Registre un nuevo profesor en potencial
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
          Guardar Profesor
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="glass-card grid w-full grid-cols-5 lg:w-[700px]">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Personal</span>
            </TabsTrigger>
            <TabsTrigger value="ubicacion" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Ubicación</span>
            </TabsTrigger>
            <TabsTrigger value="academico" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Académico</span>
            </TabsTrigger>
            <TabsTrigger value="contacto" className="flex items-center gap-2">
              <Contact className="h-4 w-4" />
              <span className="hidden sm:inline">Contacto</span>
            </TabsTrigger>
            <TabsTrigger value="adicional" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Adicional</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Personal Information */}
          <TabsContent value="personal">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  {/* CI */}
                  <div className="space-y-2">
                    <Label htmlFor="ci">
                      Carnet de Identidad{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="ci"
                      {...register("ci")}
                      placeholder="12345678901"
                      maxLength={11}
                      className={errors.ci ? "border-red-500" : ""}
                    />
                    {errors.ci && (
                      <p className="text-xs text-red-500">
                        {errors.ci.message}
                      </p>
                    )}
                  </div>

                  {/* Nombre */}
                  <div className="space-y-2">
                    <Label htmlFor="nombre">
                      Nombre <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nombre"
                      {...register("nombre")}
                      placeholder="JUAN"
                      className={errors.nombre ? "border-red-500" : ""}
                    />
                    {errors.nombre && (
                      <p className="text-xs text-red-500">
                        {errors.nombre.message}
                      </p>
                    )}
                  </div>

                  {/* Apellidos */}
                  <div className="space-y-2">
                    <Label htmlFor="apellidos">
                      Apellidos <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="apellidos"
                      {...register("apellidos")}
                      placeholder="PEREZ GARCIA"
                      className={errors.apellidos ? "border-red-500" : ""}
                    />
                    {errors.apellidos && (
                      <p className="text-xs text-red-500">
                        {errors.apellidos.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                  {/* Edad */}
                  <div className="space-y-2">
                    <Label htmlFor="edad" className="flex items-center gap-1">
                      Edad
                      <span className="text-xs text-muted-foreground">
                        (auto)
                      </span>
                    </Label>
                    <Input
                      id="edad"
                      type="number"
                      {...register("edad")}
                      placeholder="35"
                      disabled
                      className="bg-muted/50"
                    />
                  </div>

                  {/* Fecha de Nacimiento */}
                  <div className="space-y-2">
                    <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                    <Input
                      id="fechaNacimiento"
                      type="date"
                      {...register("fechaNacimiento")}
                    />
                  </div>

                  {/* Sexo */}
                  <div className="space-y-2">
                    <Label htmlFor="sexo">Sexo</Label>
                    <Select
                      value={watch("sexo")}
                      onValueChange={(value) => setValue("sexo", value as Sexo)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MASCULINO">Masculino</SelectItem>
                        <SelectItem value="FEMENINO">Femenino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Estado Civil */}
                  <div className="space-y-2">
                    <Label htmlFor="estadoCivil">Estado Civil</Label>
                    <Select
                      value={watch("estadoCivil")}
                      onValueChange={(value) =>
                        setValue("estadoCivil", value as EstadoCivil)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SOLTERO">Soltero/a</SelectItem>
                        <SelectItem value="CASADO">Casado/a</SelectItem>
                        <SelectItem value="DIVORCIADO">Divorciado/a</SelectItem>
                        <SelectItem value="VIUDO">Viudo/a</SelectItem>
                        <SelectItem value="UNION_ESTABLE">
                          Unión Estable
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Cantidad de Hijos */}
                  <div className="space-y-2">
                    <Label htmlFor="cantidadHijos">Cantidad de Hijos</Label>
                    <Input
                      id="cantidadHijos"
                      type="number"
                      {...register("cantidadHijos")}
                      placeholder="0"
                    />
                  </div>

                  {/* País de Nacimiento */}
                  <div className="space-y-2">
                    <Label htmlFor="paisNacimientoId">País de Nacimiento</Label>
                    <Select
                      value={watch("paisNacimientoId")}
                      onValueChange={(value) =>
                        setValue("paisNacimientoId", value)
                      }
                    >
                      <SelectTrigger>
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
                  </div>

                  {/* Ciudad en el Extranjero */}
                  <div className="space-y-2">
                    <Label htmlFor="ciudadEnElExtranjero">
                      Ciudad en el Extranjero
                    </Label>
                    <Input
                      id="ciudadEnElExtranjero"
                      {...register("ciudadEnElExtranjero")}
                      placeholder="Madrid"
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                  {/* Color de Piel */}
                  <div className="space-y-2">
                    <Label htmlFor="colorPiel">Color de Piel</Label>
                    <Input
                      id="colorPiel"
                      {...register("colorPiel")}
                      placeholder="BLANCA"
                    />
                  </div>

                  {/* Color de Ojos */}
                  <div className="space-y-2">
                    <Label htmlFor="colorOjos">Color de Ojos</Label>
                    <Input
                      id="colorOjos"
                      {...register("colorOjos")}
                      placeholder="AZULES"
                    />
                  </div>

                  {/* Color de Pelo */}
                  <div className="space-y-2">
                    <Label htmlFor="colorPelo">Color de Pelo</Label>
                    <Input
                      id="colorPelo"
                      {...register("colorPelo")}
                      placeholder="NEGRO"
                    />
                  </div>

                  {/* Estatura */}
                  <div className="space-y-2">
                    <Label htmlFor="estatura">Estatura (m)</Label>
                    <Input
                      id="estatura"
                      type="number"
                      step="0.01"
                      {...register("estatura")}
                      placeholder="1.75"
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Peso */}
                  <div className="space-y-2">
                    <Label htmlFor="peso">Peso (kg)</Label>
                    <Input
                      id="peso"
                      type="number"
                      step="0.01"
                      {...register("peso")}
                      placeholder="70"
                    />
                  </div>

                  {/* Señas Particulares */}
                  <div className="space-y-2">
                    <Label htmlFor="senasParticulares">
                      Señas Particulares
                    </Label>
                    <Input
                      id="senasParticulares"
                      {...register("senasParticulares")}
                      placeholder="Cicatriz en la frente"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Location */}
          <TabsContent value="ubicacion">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección Completa</Label>
                  <Textarea
                    id="direccion"
                    {...register("direccion")}
                    placeholder="Calle 123 entre A y B, Reparto Centro"
                    rows={3}
                  />
                </div>

                {/* Dirección X-22 Desglosada - Campos Esenciales */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Dirección Desglosada (Formato X-22)
                  </h3>
                  <div className="grid gap-6 md:grid-cols-4">
                    {/* Calle */}
                    <div className="space-y-2">
                      <Label htmlFor="calle">Calle</Label>
                      <Input
                        id="calle"
                        {...register("calle")}
                        placeholder="23"
                      />
                    </div>

                    {/* Número */}
                    <div className="space-y-2">
                      <Label htmlFor="numero">Número</Label>
                      <Input
                        id="numero"
                        {...register("numero")}
                        placeholder="123"
                      />
                    </div>

                    {/* Entre Calles */}
                    <div className="space-y-2">
                      <Label htmlFor="entreCalles">Entre Calles</Label>
                      <Input
                        id="entreCalles"
                        {...register("entreCalles")}
                        placeholder="A y B"
                      />
                    </div>

                    {/* Apartamento */}
                    <div className="space-y-2">
                      <Label htmlFor="apto">Apto/Local</Label>
                      <Input id="apto" {...register("apto")} placeholder="5B" />
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 mt-4">
                    {/* Localidad */}
                    <div className="space-y-2">
                      <Label htmlFor="localidad">Localidad / Reparto</Label>
                      <Input
                        id="localidad"
                        {...register("localidad")}
                        placeholder="Reparto Centro"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Provincia */}
                  <div className="space-y-2">
                    <Label htmlFor="provinciaId">Provincia</Label>
                    <Select
                      value={watch("provinciaId")}
                      onValueChange={(value) => setValue("provinciaId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione provincia..." />
                      </SelectTrigger>
                      <SelectContent>
                        {provincias.map((provincia) => (
                          <SelectItem key={provincia.id} value={provincia.id}>
                            {provincia.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Municipio */}
                  <div className="space-y-2">
                    <Label htmlFor="municipioId">Municipio</Label>
                    <Select
                      value={watch("municipioId") || ""}
                      onValueChange={(value) => setValue("municipioId", value)}
                      disabled={!provinciaId || isLoadingMunicipios}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !provinciaId
                              ? "Seleccione provincia primero"
                              : isLoadingMunicipios
                                ? "Cargando municipios..."
                                : "Seleccione municipio..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {municipiosFiltrados.length > 0 ? (
                          municipiosFiltrados.map((municipio) => (
                            <SelectItem key={municipio.id} value={municipio.id}>
                              {municipio.nombre}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-data" disabled>
                            No hay municipios disponibles
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Academic */}
          <TabsContent value="academico">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Información Académica y Laboral
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Cargo */}
                  <div className="space-y-2">
                    <Label htmlFor="cargoId">Cargo</Label>
                    <Select
                      value={watch("cargoId")}
                      onValueChange={(value) => setValue("cargoId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione cargo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {cargos.map((cargo) => (
                          <SelectItem key={cargo.id} value={cargo.id}>
                            {cargo.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Especialidad */}
                  <div className="space-y-2">
                    <Label htmlFor="especialidadId">Especialidad</Label>
                    <Select
                      value={watch("especialidadId")}
                      onValueChange={(value) =>
                        setValue("especialidadId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione especialidad..." />
                      </SelectTrigger>
                      <SelectContent>
                        {especialidades.map((especialidad) => (
                          <SelectItem
                            key={especialidad.id}
                            value={especialidad.id}
                          >
                            {especialidad.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Categoría Docente */}
                  <div className="space-y-2">
                    <Label htmlFor="categoriaDocenteId">
                      Categoría Docente
                    </Label>
                    <Select
                      value={watch("categoriaDocenteId")}
                      onValueChange={(value) =>
                        setValue("categoriaDocenteId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione categoría..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriasDocentes.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.id}>
                            {categoria.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Años de Experiencia */}
                  <div className="space-y-2">
                    <Label htmlFor="anosExperiencia">Años de Experiencia</Label>
                    <Input
                      id="anosExperiencia"
                      type="number"
                      {...register("anosExperiencia")}
                      placeholder="10"
                    />
                  </div>

                  {/* Año de Graduación */}
                  <div className="space-y-2">
                    <Label htmlFor="anoGraduado">Año de Graduación</Label>
                    <Input
                      id="anoGraduado"
                      type="number"
                      {...register("anoGraduado")}
                      placeholder="2010"
                    />
                  </div>

                  {/* Nota Promedio */}
                  <div className="space-y-2">
                    <Label htmlFor="notaPromedio">Nota Promedio</Label>
                    <Input
                      id="notaPromedio"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      {...register("notaPromedio")}
                      placeholder="4.5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="centroGraduacion">Centro de Graduación</Label>
                  <Input
                    id="centroGraduacion"
                    {...register("centroGraduacion")}
                    placeholder="Universidad de La Habana"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Nivel de Inglés */}
                  <div className="space-y-2">
                    <Label htmlFor="nivelIngles">Nivel de Inglés</Label>
                    <Select
                      value={watch("nivelIngles")}
                      onValueChange={(value) =>
                        setValue("nivelIngles", value as NivelIngles)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione nivel..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BASICO">Básico</SelectItem>
                        <SelectItem value="INTERMEDIO">Intermedio</SelectItem>
                        <SelectItem value="AVANZADO">Avanzado</SelectItem>
                        <SelectItem value="NATIVO">Nativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Estado Potencial */}
                  <div className="space-y-2">
                    <Label htmlFor="estadoPotencial">Estado</Label>
                    <Select
                      value={watch("estadoPotencial")}
                      onValueChange={(value) =>
                        setValue("estadoPotencial", value as EstadoPotencial)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione estado..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVO">Activo</SelectItem>
                        <SelectItem value="EN_PROCESO">En Proceso</SelectItem>
                        <SelectItem value="CONTRATADO">Contratado</SelectItem>
                        <SelectItem value="BAJA">Baja</SelectItem>
                        <SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Contact */}
          <TabsContent value="contacto">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Contact className="h-5 w-5" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Teléfono Fijo */}
                  <div className="space-y-2">
                    <Label htmlFor="telefonoFijo">Teléfono Fijo</Label>
                    <Input
                      id="telefonoFijo"
                      {...register("telefonoFijo")}
                      placeholder="71234567"
                    />
                  </div>

                  {/* Teléfono Móvil */}
                  <div className="space-y-2">
                    <Label htmlFor="telefonoMovil">Teléfono Móvil</Label>
                    <Input
                      id="telefonoMovil"
                      {...register("telefonoMovil")}
                      placeholder="51234567"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="juan.perez@email.cu"
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    {...register("observaciones")}
                    placeholder="Observaciones adicionales sobre el profesor..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Additional Information */}
          <TabsContent value="adicional">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Información Adicional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Fila 1: Nombre Padre, Nombre Madre, Cónyuge */}
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="nombrePadre">Nombre del Padre</Label>
                    <Input
                      id="nombrePadre"
                      {...register("nombrePadre")}
                      placeholder="PEDRO PEREZ"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombreMadre">Nombre de la Madre</Label>
                    <Input
                      id="nombreMadre"
                      {...register("nombreMadre")}
                      placeholder="MARIA GARCIA"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conyuge">Nombre del Cónyuge</Label>
                    <Input
                      id="conyuge"
                      {...register("conyuge")}
                      placeholder="ANA LOPEZ"
                    />
                  </div>
                </div>

                {/* Fila 2: Militancia PCC/UJC y Acción Colaboración */}
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="militanciaPCC"
                        {...register("militanciaPCC")}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="militanciaPCC" className="cursor-pointer">
                        Militante del PCC
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="militanciaUJC"
                        {...register("militanciaUJC")}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="militanciaUJC" className="cursor-pointer">
                        Militante de la UJC
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accionColaboracion">Sale por</Label>
                    <Input
                      id="accionColaboracion"
                      {...register("accionColaboracion")}
                      placeholder="CONTRATO"
                    />
                  </div>
                </div>

                {/* Fila 3: Familiar Aviso */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Familiar para Aviso
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="familiarAvisoNombre">Nombre</Label>
                      <Input
                        id="familiarAvisoNombre"
                        {...register("familiarAvisoNombre")}
                        placeholder="CARLOS PEREZ"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="familiarAvisoTelefono">Teléfono</Label>
                      <Input
                        id="familiarAvisoTelefono"
                        {...register("familiarAvisoTelefono")}
                        placeholder="51234567"
                      />
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
            Guardar Profesor
          </Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  BookOpen,
  LayoutDashboard,
  FileText,
  Users,
  GraduationCap,
  Upload,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Search,
  CheckCircle,
  AlertCircle,
  Info,
  Lock,
  MessageCircle,
  BookMarked,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TutorialSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  content: React.ReactNode;
}

const tutorialSections: TutorialSection[] = [
  {
    id: "intro",
    title: "Introducción al Sistema",
    icon: <BookOpen className="h-5 w-5" />,
    description: "Conoce ICE System y sus principales funcionalidades",
    content: <IntroSection />,
  },
  {
    id: "dashboard",
    title: "Panel de Control",
    icon: <LayoutDashboard className="h-5 w-5" />,
    description: "Navega por el dashboard y sus métricas",
    content: <DashboardSection />,
  },
  {
    id: "pasaportes",
    title: "Gestión de Pasaportes",
    icon: <FileText className="h-5 w-5" />,
    description: "Administra pasaportes y sus vencimientos",
    content: <PasaportesSection />,
  },
  {
    id: "potencial",
    title: "Profesores (Potencial)",
    icon: <GraduationCap className="h-5 w-5" />,
    description: "Gestiona el potencial de profesores",
    content: <PotencialSection />,
  },
  {
    id: "contratos",
    title: "Contratos",
    icon: <FileText className="h-5 w-5" />,
    description: "Administra contratos y prórrogas",
    content: <ContratosSection />,
  },
  {
    id: "importacion",
    title: "Importación Masiva",
    icon: <Upload className="h-5 w-5" />,
    description: "Importa datos desde archivos Excel/CSV",
    content: <ImportacionSection />,
  },
  {
    id: "usuarios",
    title: "Gestión de Usuarios",
    icon: <Users className="h-5 w-5" />,
    description: "Roles y permisos del sistema",
    content: <UsuariosSection />,
  },
  {
    id: "faq",
    title: "Preguntas Frecuentes",
    icon: <MessageCircle className="h-5 w-5" />,
    description: "Respuestas a las dudas más comunes",
    content: <FAQSection />,
  },
  {
    id: "glosario",
    title: "Glosario de Términos",
    icon: <BookMarked className="h-5 w-5" />,
    description: "Definiciones de términos usados en el sistema",
    content: <GlosarioSection />,
  },
];

export default function AyudaPage() {
  const [currentSection, setCurrentSection] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSections = tutorialSections.filter(
    (section) =>
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const nextSection = () => {
    if (currentSection < tutorialSections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-blue-600" />
            Centro de Ayuda
          </h2>
          <p className="text-muted-foreground">
            Guía completa del sistema ICE - International Cooperation of
            Educators
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar en la ayuda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Progreso: {currentSection + 1} de {tutorialSections.length}{" "}
              secciones
            </span>
            <span className="text-sm font-medium">
              {Math.round(
                ((currentSection + 1) / tutorialSections.length) * 100,
              )}
              % completado
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentSection + 1) / tutorialSections.length) * 100}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <Card className="glass-card lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Contenido</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <nav className="space-y-1">
              {filteredSections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() =>
                    setCurrentSection(tutorialSections.indexOf(section))
                  }
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    tutorialSections.indexOf(section) === currentSection
                      ? "bg-blue-50 border-l-4 border-blue-600 text-blue-700"
                      : "hover:bg-gray-50 border-l-4 border-transparent"
                  }`}
                >
                  <span
                    className={
                      tutorialSections.indexOf(section) === currentSection
                        ? "text-blue-600"
                        : "text-gray-500"
                    }
                  >
                    {section.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {section.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {section.description}
                    </p>
                  </div>
                  {tutorialSections.indexOf(section) === currentSection && (
                    <ChevronRight className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="glass-card">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {tutorialSections[currentSection].icon}
                </div>
                <div>
                  <CardTitle>
                    {tutorialSections[currentSection].title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {tutorialSections[currentSection].description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {tutorialSections[currentSection].content}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevSection}
              disabled={currentSection === 0}
              className="glass-button"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <Button
              onClick={nextSection}
              disabled={currentSection === tutorialSections.length - 1}
              className="glass-button bg-blue-600 hover:bg-blue-700"
            >
              Siguiente
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// SECTION COMPONENTS

function IntroSection() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-8">
        <h3 className="text-2xl font-bold mb-4">Bienvenido a ICE System</h3>
        <p className="text-lg opacity-90">
          Sistema integral para la gestión de profesores, pasaportes, contratos
          y trámites de colaboración internacional.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              ¿Qué puedes hacer?
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Gestionar el potencial de profesores</li>
              <li>• Administrar pasaportes y visas</li>
              <li>• Controlar contratos y prórrogas</li>
              <li>• Generar actas de extranjería</li>
              <li>• Importar datos masivamente</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Primeros pasos
            </h4>
            <ol className="space-y-2 text-sm text-gray-600">
              <li>1. Carga profesores en Potencial</li>
              <li>2. Registra sus pasaportes</li>
              <li>3. Crea contratos cuando sean contratados</li>
              <li>4. Gestiona prórrogas según necesidad</li>
              <li>5. Genera documentos oficiales</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-800">Importante</h4>
            <p className="text-sm text-yellow-700">
              Esta guía muestra ejemplos visuales de los formularios
              deshabilitados. Para interactuar con el sistema real, navega por
              el menú lateral.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSection() {
  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        El Dashboard es tu centro de control donde puedes ver métricas
        importantes y alertas del sistema en tiempo real.
      </p>

      {/* Example Dashboard Preview */}
      <div className="space-y-4">
        <h4 className="font-semibold">Vista previa del Dashboard</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-75 pointer-events-none">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Profesores Activos</p>
                  <p className="text-2xl font-bold">245</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pasaportes por Vencer</p>
                  <p className="text-2xl font-bold text-yellow-600">12</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Contratos Activos</p>
                  <p className="text-2xl font-bold text-green-600">38</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-center py-4">
          <Badge variant="secondary" className="flex items-center gap-2">
            <Lock className="h-3 w-3" />
            Ejemplo visual - Dashboard real en la página principal
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold">Elementos del Dashboard</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
              1
            </div>
            <div>
              <p className="font-medium">Métricas Principales</p>
              <p className="text-sm text-gray-600">
                Muestra conteos de profesores, pasaportes, contratos y alertas
                importantes.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
              2
            </div>
            <div>
              <p className="font-medium">Alertas de Vencimiento</p>
              <p className="text-sm text-gray-600">
                Notifica sobre pasaportes y visas próximos a vencer (30, 60, 90
                días).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
              3
            </div>
            <div>
              <p className="font-medium">Accesos Rápidos</p>
              <p className="text-sm text-gray-600">
                Botones para acceder rápidamente a las funciones más usadas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasaportesSection() {
  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        El módulo de Pasaportes te permite gestionar todos los documentos de
        viaje de los profesores, controlar fechas de vencimiento y administrar
        visas asociadas.
      </p>

      <Tabs defaultValue="listado" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="listado">Listado</TabsTrigger>
          <TabsTrigger value="crear">Crear Pasaporte</TabsTrigger>
          <TabsTrigger value="visas">Visas</TabsTrigger>
        </TabsList>

        <TabsContent value="listado" className="space-y-4">
          <h4 className="font-semibold">Vista de Listado</h4>
          <div className="border rounded-lg overflow-hidden opacity-75 pointer-events-none">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
              <Input
                placeholder="Buscar pasaporte..."
                className="w-64"
                disabled
              />
              <Button disabled>Nuevo Pasaporte</Button>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {[
                  {
                    num: "E355896",
                    prof: "ALVAREZ PEREZ, LUIS",
                    venc: "14/03/2024",
                    estado: "warning",
                  },
                  {
                    num: "E396485",
                    prof: "AVILA DIAZ, JOSE",
                    venc: "15/08/2025",
                    estado: "success",
                  },
                  {
                    num: "E416536",
                    prof: "BARRETO BORGES, JESUS",
                    venc: "20/12/2023",
                    estado: "danger",
                  },
                ].map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{p.num}</p>
                        <p className="text-sm text-gray-500">{p.prof}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          p.estado === "success"
                            ? "default"
                            : p.estado === "warning"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        Vence: {p.venc}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            El listado muestra todos los pasaportes activos con indicadores de
            color según la proximidad del vencimiento.
          </p>
        </TabsContent>

        <TabsContent value="crear" className="space-y-4">
          <h4 className="font-semibold">Formulario de Creación</h4>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
            <div className="flex items-center justify-center gap-2 mb-4 text-gray-500">
              <Lock className="h-4 w-4" />
              <span className="text-sm">Vista previa del formulario</span>
            </div>
            <div className="space-y-4 max-w-lg mx-auto opacity-75 pointer-events-none">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Pasaporte</Label>
                  <select className="w-full p-2 border rounded" disabled>
                    <option>ORDINARIO</option>
                    <option>DIPLOMÁTICO</option>
                    <option>OFICIAL</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input placeholder="E355896" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Profesor</Label>
                <select className="w-full p-2 border rounded" disabled>
                  <option>Seleccione un profesor...</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Expedición</Label>
                  <Input type="date" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Vencimiento</Label>
                  <Input type="date" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Lugar de Expedición</Label>
                <Input placeholder="HABANA" disabled />
              </div>
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <textarea
                  className="w-full p-2 border rounded h-20"
                  disabled
                  placeholder="Notas adicionales..."
                />
              </div>
              <Button className="w-full" disabled>
                Guardar Pasaporte
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="visas" className="space-y-4">
          <h4 className="font-semibold">Gestión de Visas</h4>
          <p className="text-sm text-gray-600">
            Cada pasaporte puede tener múltiples visas asociadas. Las visas se
            gestionan desde el detalle de cada pasaporte.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75 pointer-events-none">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tipos de Visa</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Badge variant="outline">Trabajo</Badge>
                    <span className="text-gray-600">
                      Para contratos laborales
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline">Turista</Badge>
                    <span className="text-gray-600">Visitas temporales</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline">Estudiante</Badge>
                    <span className="text-gray-600">Programas académicos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline">Residente</Badge>
                    <span className="text-gray-600">Residencia permanente</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estados de Visa</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">Vigente</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-gray-600">Por Vencer</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-red-500" />
                    <span className="text-gray-600">Vencida</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-600">Cancelada</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">💡 Tip Importante</h4>
        <p className="text-sm text-blue-700">
          Usa la función de importación masiva para cargar múltiples pasaportes
          desde un archivo Excel. Ve a Trámites → Importar Pasaportes para más
          información.
        </p>
      </div>
    </div>
  );
}

function PotencialSection() {
  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        El Potencial es el registro maestro de todos los profesores candidatos o
        disponibles para colaboración internacional. Aquí se almacena toda la
        información personal y profesional.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold">Datos del Profesor</h4>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 opacity-75 pointer-events-none">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input placeholder="Juan" disabled className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Apellidos</Label>
                  <Input placeholder="Pérez García" disabled className="h-8" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CI (Carnet de Identidad)</Label>
                <Input placeholder="00123456789" disabled className="h-8" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Edad</Label>
                  <Input placeholder="35" disabled className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sexo</Label>
                  <select
                    className="w-full p-1 border rounded h-8 text-sm"
                    disabled
                  >
                    <option>Masculino</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Estado Civil</Label>
                  <select
                    className="w-full p-1 border rounded h-8 text-sm"
                    disabled
                  >
                    <option>Soltero</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Dirección</Label>
                <Input
                  placeholder="Calle 123, Municipio, Provincia"
                  disabled
                  className="h-8"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Teléfono Móvil</Label>
                  <Input placeholder="+53 5 1234567" disabled className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Correo Electrónico</Label>
                  <Input
                    placeholder="profesor@email.com"
                    disabled
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">Datos Laborales y Académicos</h4>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 opacity-75 pointer-events-none">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Cargo</Label>
                <select
                  className="w-full p-1 border rounded h-8 text-sm"
                  disabled
                >
                  <option>Profesor de Idiomas</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Especialidad</Label>
                <select
                  className="w-full p-1 border rounded h-8 text-sm"
                  disabled
                >
                  <option>Inglés</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Categoría Docente</Label>
                <select
                  className="w-full p-1 border rounded h-8 text-sm"
                  disabled
                >
                  <option>Titular</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Años de Experiencia</Label>
                  <Input placeholder="10" disabled className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nivel de Inglés</Label>
                  <select
                    className="w-full p-1 border rounded h-8 text-sm"
                    disabled
                  >
                    <option>Avanzado</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Centro de Graduación</Label>
                <Input
                  placeholder="Universidad de La Habana"
                  disabled
                  className="h-8"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold">Estados del Profesor</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            {
              estado: "ACTIVO",
              color: "green",
              desc: "Disponible para contratación",
            },
            {
              estado: "EN_PROCESO",
              color: "blue",
              desc: "En trámites de contratación",
            },
            {
              estado: "CONTRATADO",
              color: "purple",
              desc: "Ya tiene contrato activo",
            },
            { estado: "BAJA", color: "gray", desc: "No disponible" },
          ].map((item, i) => (
            <Card key={i} className="border-2">
              <CardContent className="pt-4">
                <Badge
                  className={`mb-2 ${
                    item.color === "green"
                      ? "bg-green-100 text-green-800"
                      : item.color === "blue"
                        ? "bg-blue-100 text-blue-800"
                        : item.color === "purple"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {item.estado}
                </Badge>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContratosSection() {
  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Gestiona todos los contratos de colaboración internacional, sus
        prórrogas y documentos asociados.
      </p>

      <div className="space-y-4">
        <h4 className="font-semibold">Ciclo de Vida de un Contrato</h4>
        <div className="flex flex-wrap items-center gap-2">
          {["Borrador", "→", "Activo", "→", "Prorrogado", "→", "Cerrado"].map(
            (step, i) => (
              <div key={i}>
                {step === "→" ? (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                ) : (
                  <Badge
                    variant={
                      step === "Borrador"
                        ? "outline"
                        : step === "Activo"
                          ? "default"
                          : step === "Prorrogado"
                            ? "secondary"
                            : "outline"
                    }
                    className="px-4 py-2"
                  >
                    {step}
                  </Badge>
                )}
              </div>
            ),
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold">Datos del Contrato</h4>
          <div className="border rounded-lg p-4 opacity-75 pointer-events-none space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Número</Label>
                <Input placeholder="001" disabled className="h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Año</Label>
                <Input placeholder="2024" disabled className="h-8" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Profesor</Label>
              <select
                className="w-full p-1 border rounded h-8 text-sm"
                disabled
              >
                <option>Seleccione profesor...</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">País de Destino</Label>
              <select
                className="w-full p-1 border rounded h-8 text-sm"
                disabled
              >
                <option>México</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Función / Cargo</Label>
              <Input
                placeholder="Profesor de Español"
                disabled
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Fecha Inicio</Label>
                <Input type="date" disabled className="h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fecha Fin</Label>
                <Input type="date" disabled className="h-8" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Salario Mensual</Label>
              <Input placeholder="1500.00" disabled className="h-8" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">Prórrogas</h4>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-4">
              Las prórrogas permiten extender la duración de un contrato. Cada
              contrato puede tener múltiples prórrogas.
            </p>
            <div className="space-y-2 opacity-75 pointer-events-none">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                <div>
                  <p className="font-medium text-sm">Prórroga #1</p>
                  <p className="text-xs text-gray-500">
                    01/01/2025 - 30/06/2025
                  </p>
                </div>
                <Badge variant="outline">6 meses</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                <div>
                  <p className="font-medium text-sm">Prórroga #2</p>
                  <p className="text-xs text-gray-500">
                    01/07/2025 - 31/12/2025
                  </p>
                </div>
                <Badge variant="outline">6 meses</Badge>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4">
            <h5 className="font-medium mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Documentos Generables
            </h5>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Acta de Extranjería</li>
              <li>• Suplemento de Prórroga</li>
              <li>• Acta de Cierre de Contrato</li>
              <li>• Certificación de trabajo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImportacionSection() {
  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        La importación masiva permite cargar grandes cantidades de datos desde
        archivos Excel o CSV, ahorrando tiempo en la carga manual.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Importar Pasaportes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Carga múltiples pasaportes desde un archivo Excel o CSV.
            </p>
            <div className="space-y-2 text-sm">
              <p className="font-medium">Columnas requeridas:</p>
              <ul className="space-y-1 text-gray-600 ml-4">
                <li>• Pasaporte # (número)</li>
                <li>• Colaborador (Apellidos, Nombre)</li>
                <li>• Fecha Vencimiento (MM/DD/YYYY)</li>
              </ul>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 rounded text-sm text-yellow-800">
              <strong>Nota:</strong> El profesor debe existir previamente en
              Potencial.
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Importar Profesores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Carga el potencial de profesores desde Excel.
            </p>
            <div className="space-y-2 text-sm">
              <p className="font-medium">Columnas requeridas:</p>
              <ul className="space-y-1 text-gray-600 ml-4">
                <li>• CI (Carnet de Identidad)</li>
                <li>• Nombre</li>
                <li>• Apellidos</li>
                <li>• Provincia y Municipio</li>
              </ul>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
              <strong>Tip:</strong> Usa la plantilla descargable como
              referencia.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold">Proceso de Importación</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              step: 1,
              title: "Preparar",
              desc: "Descarga la plantilla y llena los datos",
            },
            {
              step: 2,
              title: "Validar",
              desc: "Verifica que los datos estén correctos",
            },
            { step: 3, title: "Importar", desc: "Sube el archivo al sistema" },
            {
              step: 4,
              title: "Revisar",
              desc: "Verifica el resumen de resultados",
            },
          ].map((item) => (
            <div key={item.step} className="relative">
              <div className="bg-white border-2 rounded-lg p-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mb-2">
                  {item.step}
                </div>
                <h5 className="font-semibold">{item.title}</h5>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
              {item.step < 4 && (
                <ChevronRight className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Consideraciones Importantes
        </h4>
        <ul className="space-y-1 text-sm text-red-700">
          <li>
            • Para importar pasaportes, los profesores deben existir primero en
            Potencial
          </li>
          <li>
            • Los registros con errores no se importarán pero se mostrarán en el
            resumen
          </li>
          <li>• Los pasaportes duplicados se saltarán automáticamente</li>
          <li>• Mantén un respaldo de tus archivos antes de importar</li>
        </ul>
      </div>
    </div>
  );
}

function UsuariosSection() {
  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        El sistema tiene tres roles de usuario con diferentes niveles de acceso
        y permisos.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-purple-200">
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-lg text-purple-800">ADMIN</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-3">
              Administrador del sistema
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Todas las funciones</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Gestión de usuarios</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Configuración</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Eliminar registros</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-lg text-blue-800">OPERADOR</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-3">Usuario estándar</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Crear y editar</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Importar datos</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Generar documentos</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-red-400" />
                <span className="text-gray-400">No eliminar</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-lg text-gray-800">CONSULTA</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600 mb-3">Solo lectura</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Ver registros</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Buscar y filtrar</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Exportar reportes</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-red-400" />
                <span className="text-gray-400">No crear/editar</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Seguridad</h4>
        <ul className="space-y-1 text-sm text-blue-700">
          <li>• Todas las acciones quedan registradas en el historial</li>
          <li>• Los datos eliminados se mueven a la Papelera</li>
          <li>• Las sesiones expiran por inactividad</li>
          <li>• Las contraseñas deben cumplir requisitos de seguridad</li>
        </ul>
      </div>
    </div>
  );
}

function FAQSection() {
  const faqs = [
    {
      question: "¿Qué hago si no encuentro un profesor al importar pasaportes?",
      answer:
        "El profesor debe existir primero en la sección 'Potencial'. Ve a Potencial → Nuevo Profesor, crea el registro con los datos básicos (CI, nombre, apellidos), y luego reintenta la importación del pasaporte.",
    },
    {
      question: "¿Cómo puedo extender la duración de un contrato?",
      answer:
        "No se modifican las fechas del contrato directamente. Debes crear una 'Prórroga' desde el detalle del contrato. Ve a Contratos → Selecciona el contrato → Agregar Prórroga. Esto mantendrá el historial completo.",
    },
    {
      question: "¿Qué pasa si elimino un registro por error?",
      answer:
        "Los registros eliminados van a la 'Papelera' donde pueden restaurarse. Ve a Papelera en el menú lateral, busca el registro y haz clic en 'Restaurar'. Los registros en papelera se mantienen por 30 días.",
    },
    {
      question: "¿Cómo genero un Acta de Extranjería?",
      answer:
        "Ve a Actas Extranjería → Nueva Acta. Selecciona el profesor, el contrato asociado, y completa los datos requeridos. El sistema generará automáticamente el número de acta consecutivo.",
    },
    {
      question: "¿Puedo exportar los datos a Excel?",
      answer:
        "Sí, la mayoría de las listas tienen opción de exportar. Busca el botón 'Exportar' o 'Descargar' en la parte superior de las tablas. Los datos se exportan en formato Excel (.xlsx).",
    },
    {
      question: "¿Qué significa el estado 'En Proceso' de un profesor?",
      answer:
        "Indica que el profesor está en trámites de contratación pero aún no tiene un contrato activo. Una vez firmado el contrato, el estado cambiará automáticamente a 'Contratado'.",
    },
    {
      question: "¿Cómo veo los pasaportes próximos a vencer?",
      answer:
        "El Dashboard muestra alertas de vencimiento. También puedes ir a Pasaportes y usar el filtro 'Alertas' para ver los que vencen en 30, 60 o 90 días.",
    },
    {
      question: "¿Qué formatos de archivo acepta la importación?",
      answer:
        "Se aceptan archivos Excel (.xlsx, .xls) y CSV (.csv). Se recomienda usar la plantilla descargable disponible en la página de importación para asegurar el formato correcto.",
    },
    {
      question: "¿Puedo modificar un pasaporte ya creado?",
      answer:
        "Sí, ve a Pasaportes → busca el pasaporte → Editar. Sin embargo, el número de pasaporte no se puede modificar una vez creado. Si hay un error en el número, debes eliminarlo y crearlo de nuevo.",
    },
    {
      question: "¿Qué diferencia hay entre OPERADOR y CONSULTA?",
      answer:
        "OPERADOR puede crear, editar e importar datos. CONSULTA solo puede ver y exportar información, no puede crear ni modificar registros. ADMIN tiene acceso total incluyendo gestión de usuarios.",
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Aquí encontrarás respuestas a las preguntas más frecuentes sobre el uso
        del sistema ICE.
      </p>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <Card
            key={index}
            className="border hover:border-blue-300 transition-colors"
          >
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">
                    {faq.question}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          ¿No encuentras tu respuesta?
        </h4>
        <p className="text-sm text-blue-700">
          Si tienes alguna duda adicional o necesitas soporte técnico, contacta
          al administrador del sistema o revisa la documentación detallada de
          cada módulo en las secciones anteriores.
        </p>
      </div>
    </div>
  );
}

function GlosarioSection() {
  const terminos = [
    {
      termino: "Potencial",
      definicion:
        "Base de datos maestra de todos los profesores candidatos disponibles para colaboración internacional. Es el primer paso antes de crear cualquier contrato o pasaporte.",
      categoria: "General",
    },
    {
      termino: "Pasaporte",
      definicion:
        "Documento de viaje asociado a un profesor. En el sistema se registra el número, tipo, fechas de expedición y vencimiento, y lugar de expedición.",
      categoria: "Documentos",
    },
    {
      termino: "Visa",
      definicion:
        "Permiso de entrada a un país específico asociado a un pasaporte. Puede ser de trabajo, turista, estudiante o residente. Cada pasaporte puede tener múltiples visas.",
      categoria: "Documentos",
    },
    {
      termino: "Contrato",
      definicion:
        "Acuerdo laboral entre el profesor y la entidad contratante. Incluye fechas, salario, función, país de destino y condiciones del trabajo.",
      categoria: "Laboral",
    },
    {
      termino: "Prórroga",
      definicion:
        "Extensión de la duración de un contrato. Se registra como un documento adicional manteniendo el historial completo del contrato original.",
      categoria: "Laboral",
    },
    {
      termino: "Acta de Extranjería",
      definicion:
        "Documento oficial que certifica la salida del país del profesor con fines de colaboración. Se genera desde el sistema con número consecutivo automático.",
      categoria: "Documentos",
    },
    {
      termino: "Suplemento",
      definicion:
        "Documento oficial que registra una prórroga de contrato. Se genera automáticamente al crear una prórroga en el sistema.",
      categoria: "Documentos",
    },
    {
      termino: "Estado Potencial",
      definicion:
        "Situación actual del profesor en la base de datos: ACTIVO (disponible), EN_PROCESO (en trámites), CONTRATADO (con contrato vigente), BAJA (no disponible).",
      categoria: "Estados",
    },
    {
      termino: "Papelera",
      definicion:
        "Área donde se almacenan temporalmente los registros eliminados. Permite restaurar registros eliminados por error durante 30 días.",
      categoria: "Sistema",
    },
    {
      termino: "CI",
      definicion:
        "Carnet de Identidad. Número único de identificación personal requerido para crear un profesor en el sistema.",
      categoria: "Datos",
    },
    {
      termino: "Importación Masiva",
      definicion:
        "Funcionalidad que permite cargar múltiples registros desde archivos Excel o CSV, ahorrando tiempo en la carga manual individual.",
      categoria: "Sistema",
    },
    {
      termino: "Nomenclador",
      definicion:
        "Catálogos de datos de referencia como provincias, municipios, países, cargos y especialidades. Se usan para estandarizar la información.",
      categoria: "Sistema",
    },
    {
      termino: "Fecha de Vencimiento",
      definicion:
        "Fecha límite de validez de un documento (pasaporte o visa). El sistema genera alertas automáticas 90, 60 y 30 días antes del vencimiento.",
      categoria: "Alertas",
    },
    {
      termino: "Alerta",
      definicion:
        "Notificación automática del sistema sobre eventos importantes como vencimientos próximos, contratos por finalizar o datos incompletos.",
      categoria: "Alertas",
    },
  ];

  const categorias = Array.from(new Set(terminos.map((t) => t.categoria)));

  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Definiciones de términos técnicos y conceptos utilizados en el sistema
        ICE.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categorias.map((categoria) => (
          <Card key={categoria} className="border-2">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-lg">{categoria}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {terminos
                .filter((t) => t.categoria === categoria)
                .map((item, idx) => (
                  <div
                    key={idx}
                    className="border-b last:border-0 pb-3 last:pb-0"
                  >
                    <h5 className="font-semibold text-blue-700 mb-1">
                      {item.termino}
                    </h5>
                    <p className="text-sm text-gray-600">{item.definicion}</p>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
          <Info className="h-5 w-5" />
          Nota importante
        </h4>
        <p className="text-sm text-amber-700">
          Algunos términos pueden tener significados específicos dentro del
          contexto del sistema ICE que difieren de su uso general. Siempre
          consulta esta guía cuando tengas dudas sobre la terminología utilizada
          en el sistema.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  papeleraService,
  PapeleraItem,
  tipoPapeleraLabels,
  tipoPapeleraColors,
} from "@/services/papelera.service";
import { NotificationService } from "@/services/notification.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";
import {
  Search,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Filter,
  User,
  FileText,
  BookOpen,
  StickyNote,
  Calendar,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Componente para mostrar detalles de forma amigable según el tipo de registro
function RecordDetailsView({ tipo, datos }: { tipo: string; datos: any }) {
  if (!datos) return null;

  const InfoRow = ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="flex justify-between items-start py-1.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-medium text-sm text-right max-w-[200px]">
        {value || "—"}
      </span>
    </div>
  );

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-1">
      <h4 className="text-sm font-medium text-muted-foreground mb-2">
        {title}
      </h4>
      {children}
    </div>
  );

  switch (tipo) {
    case "PROFESOR":
      return (
        <div className="space-y-5">
          <Section title="Información personal">
            <InfoRow
              label="Nombre completo"
              value={`${datos.nombre || ""} ${datos.apellidos || ""}`.trim()}
            />
            <InfoRow label="Carnet de identidad" value={datos.ci} />
            <InfoRow
              label="Edad"
              value={datos.edad ? `${datos.edad} años` : null}
            />
            <InfoRow
              label="Sexo"
              value={
                datos.sexo === "MASCULINO"
                  ? "Masculino"
                  : datos.sexo === "FEMENINO"
                    ? "Femenino"
                    : datos.sexo
              }
            />
          </Section>

          {(datos.telefonoMovil || datos.email) && (
            <Section title="Contacto">
              <InfoRow label="Teléfono móvil" value={datos.telefonoMovil} />
              <InfoRow label="Email" value={datos.email} />
            </Section>
          )}

          {(datos.cargo?.nombre || datos.especialidad?.nombre) && (
            <Section title="Información laboral">
              <InfoRow
                label="Cargo"
                value={datos.cargo?.nombre || datos.cargoId}
              />
              <InfoRow
                label="Especialidad"
                value={datos.especialidad?.nombre || datos.especialidadId}
              />
              <InfoRow
                label="Años de experiencia"
                value={datos.anosExperiencia}
              />
            </Section>
          )}

          {datos.observaciones && (
            <div className="pt-3 border-t">
              <p className="text-sm text-muted-foreground">Observaciones</p>
              <p className="text-sm mt-1">{datos.observaciones}</p>
            </div>
          )}
        </div>
      );

    case "CONTRATO":
      return (
        <div className="space-y-5">
          <Section title="Información del contrato">
            <InfoRow
              label="Número"
              value={`${datos.numeroConsecutivo || "—"}/${datos.ano || "—"}`}
            />
            <InfoRow label="Función" value={datos.funcion} />
            <InfoRow label="Centro de trabajo" value={datos.centroTrabajo} />
            <InfoRow label="Estado" value={datos.estado} />
          </Section>

          <Section title="Período">
            <InfoRow
              label="Duración"
              value={
                datos.fechaInicio && datos.fechaFin
                  ? `${new Date(datos.fechaInicio).toLocaleDateString()} - ${new Date(datos.fechaFin).toLocaleDateString()}`
                  : null
              }
            />
          </Section>

          {(datos.salarioMensual || datos.moneda) && (
            <Section title="Información salarial">
              <InfoRow
                label="Salario mensual"
                value={datos.salarioMensual ? `$${datos.salarioMensual}` : null}
              />
              <InfoRow label="Moneda" value={datos.moneda} />
            </Section>
          )}
        </div>
      );

    case "PASAPORTE":
      return (
        <div className="space-y-5">
          <Section title="Información del pasaporte">
            <InfoRow label="Número" value={datos.numero} />
            <InfoRow
              label="Tipo"
              value={
                datos.tipo === "ORDINARIO"
                  ? "Ordinario"
                  : datos.tipo === "OFICIAL"
                    ? "Oficial"
                    : datos.tipo === "DIPLOMATICO"
                      ? "Diplomático"
                      : datos.tipo
              }
            />
            <InfoRow
              label="Lugar de expedición"
              value={datos.lugarExpedicion}
            />
          </Section>

          <Section title="Vigencia">
            <InfoRow
              label="Expedición"
              value={
                datos.fechaExpedicion
                  ? new Date(datos.fechaExpedicion).toLocaleDateString()
                  : null
              }
            />
            <InfoRow
              label="Vencimiento"
              value={
                datos.fechaVencimiento
                  ? new Date(datos.fechaVencimiento).toLocaleDateString()
                  : null
              }
            />
          </Section>
        </div>
      );

    case "VISA":
      return (
        <div className="space-y-5">
          <Section title="Información de la visa">
            <InfoRow label="Tipo" value={datos.tipo} />
            <InfoRow label="Número" value={datos.numero} />
            <InfoRow label="País de emisión" value={datos.paisEmision} />
          </Section>

          <Section title="Vigencia">
            <InfoRow
              label="Emisión"
              value={
                datos.fechaEmision
                  ? new Date(datos.fechaEmision).toLocaleDateString()
                  : null
              }
            />
            <InfoRow
              label="Vencimiento"
              value={
                datos.fechaVencimiento
                  ? new Date(datos.fechaVencimiento).toLocaleDateString()
                  : null
              }
            />
            <InfoRow label="Entradas permitidas" value={datos.numeroEntradas} />
            <InfoRow label="Duración (días)" value={datos.duracionDias} />
          </Section>
        </div>
      );

    case "PRORROGA":
      return (
        <div className="space-y-5">
          <Section title="Información de la prórroga">
            <InfoRow label="Número" value={`#${datos.numeroProrroga}`} />
            <InfoRow label="Motivo" value={datos.motivo} />
          </Section>

          <Section title="Período extendido">
            <InfoRow
              label="Desde"
              value={
                datos.fechaDesde
                  ? new Date(datos.fechaDesde).toLocaleDateString()
                  : null
              }
            />
            <InfoRow
              label="Hasta"
              value={
                datos.fechaHasta
                  ? new Date(datos.fechaHasta).toLocaleDateString()
                  : null
              }
            />
          </Section>
        </div>
      );

    case "USUARIO":
      return (
        <div className="space-y-5">
          <Section title="Información del usuario">
            <InfoRow
              label="Nombre completo"
              value={`${datos.nombre || ""} ${datos.apellidos || ""}`.trim()}
            />
            <InfoRow label="Usuario" value={datos.username} />
            <InfoRow label="Email" value={datos.email} />
            <InfoRow
              label="Rol"
              value={
                datos.rol === "ADMIN"
                  ? "Administrador"
                  : datos.rol === "OPERADOR"
                    ? "Operador"
                    : "Consulta"
              }
            />
          </Section>
        </div>
      );

    default:
      return (
        <div className="text-sm text-muted-foreground">
          Información no disponible para este tipo de registro.
        </div>
      );
  }
}

const tipoIconos: Record<string, React.ReactNode> = {
  PROFESOR: <User className="h-4 w-4" />,
  CONTRATO: <FileText className="h-4 w-4" />,
  PASAPORTE: <BookOpen className="h-4 w-4" />,
  VISA: <StickyNote className="h-4 w-4" />,
  PRORROGA: <Calendar className="h-4 w-4" />,
  USUARIO: <User className="h-4 w-4" />,
};

export default function PapeleraPage() {
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const [items, setItems] = useState<PapeleraItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItem, setSelectedItem] = useState<PapeleraItem | null>(null);

  const isAdmin = hasRole(["ADMIN"]);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const response = await papeleraService.getAll({
        page: currentPage,
        limit: 10,
        tipo: tipoFiltro || undefined,
      });
      setItems(response.data);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (error) {
      NotificationService.error("Error al cargar la papelera");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [currentPage, tipoFiltro]);

  const handleRestaurar = async (item: PapeleraItem) => {
    const confirmed = await NotificationService.confirm(
      "Restaurar registro",
      `¿Desea restaurar el ${tipoPapeleraLabels[item.tipo].toLowerCase()} <strong>${item.datos?.nombre || item.datos?.apellidos || item.datos?.numero || "Registro"}</strong>?`,
      {
        confirmText: "Sí, restaurar",
        cancelText: "Cancelar",
        icon: "info",
      },
    );

    if (!confirmed) return;

    const loadingToast = NotificationService.loading("Restaurando registro...");

    try {
      await papeleraService.restaurar(item.id);

      NotificationService.update(
        loadingToast,
        "Registro restaurado exitosamente",
        "success",
      );
      await NotificationService.successDialog(
        "Restauración Exitosa",
        `El ${tipoPapeleraLabels[item.tipo].toLowerCase()} ha sido restaurado correctamente.`,
      );

      loadItems();
    } catch (error: any) {
      NotificationService.update(loadingToast, "Error al restaurar", "error");
      await NotificationService.errorDialog(
        "Error",
        error.message || "No se pudo restaurar el registro.",
      );
    }
  };

  const handleEliminarPermanente = async (item: PapeleraItem) => {
    if (!isAdmin) {
      NotificationService.error(
        "Solo los administradores pueden eliminar permanentemente",
      );
      return;
    }

    const confirmed = await NotificationService.confirmDelete(
      `${tipoPapeleraLabels[item.tipo]}: ${item.datos?.nombre || item.datos?.apellidos || item.datos?.numero || "Registro"}`,
    );

    if (!confirmed) return;

    const loadingToast = NotificationService.loading(
      "Eliminando permanentemente...",
    );

    try {
      await papeleraService.eliminarPermanente(item.id);

      NotificationService.update(
        loadingToast,
        "Registro eliminado permanentemente",
        "success",
      );

      loadItems();
    } catch (error: any) {
      NotificationService.update(loadingToast, "Error al eliminar", "error");
      await NotificationService.errorDialog(
        "Error",
        error.message || "No se pudo eliminar el registro.",
      );
    }
  };

  const handleVaciarPapelera = async () => {
    if (!isAdmin) {
      NotificationService.error(
        "Solo los administradores pueden vaciar la papelera",
      );
      return;
    }

    const confirmed = await NotificationService.confirm(
      "Vaciar papelera",
      "¿Está seguro que desea vaciar la papelera?<br><strong>Esta acción eliminará permanentemente todos los registros restaurados.</strong>",
      {
        confirmText: "Sí, vaciar",
        cancelText: "Cancelar",
        icon: "warning",
        confirmColor: "#dc2626",
      },
    );

    if (!confirmed) return;

    const loadingToast = NotificationService.loading("Vaciando papelera...");

    try {
      await papeleraService.vaciarPapelera();

      NotificationService.update(
        loadingToast,
        "Papelera vaciada correctamente",
        "success",
      );

      loadItems();
    } catch (error: any) {
      NotificationService.update(
        loadingToast,
        "Error al vaciar papelera",
        "error",
      );
      await NotificationService.errorDialog(
        "Error",
        error.message || "No se pudo vaciar la papelera.",
      );
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: es });
  };

  const getItemTitle = (item: PapeleraItem) => {
    const datos = item.datos || {};
    switch (item.tipo) {
      case "PROFESOR":
        return (
          `${datos.nombre || ""} ${datos.apellidos || ""}`.trim() ||
          "Profesor sin nombre"
        );
      case "CONTRATO":
        return `Contrato ${datos.numeroConsecutivo || ""}/${datos.ano || ""}`;
      case "PASAPORTE":
        return `Pasaporte ${datos.numero || ""}`;
      case "VISA":
        return `Visa ${datos.tipo || ""}`;
      case "PRORROGA":
        return `Prórroga #${datos.numeroProrroga || ""}`;
      case "USUARIO":
        return (
          `${datos.nombre || ""} ${datos.apellidos || ""}`.trim() ||
          "Usuario sin nombre"
        );
      default:
        return "Registro";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Papelera de Reciclaje
          </h2>
          <p className="text-muted-foreground">
            Registros eliminados que pueden ser restaurados
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && items.length > 0 && (
            <Button
              variant="outline"
              onClick={handleVaciarPapelera}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Vaciar Papelera
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <Select
                value={tipoFiltro || "ALL"}
                onValueChange={(value) =>
                  setTipoFiltro(value === "ALL" ? "" : value)
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los tipos</SelectItem>
                  <SelectItem value="PROFESOR">Profesores</SelectItem>
                  <SelectItem value="CONTRATO">Contratos</SelectItem>
                  <SelectItem value="PASAPORTE">Pasaportes</SelectItem>
                  <SelectItem value="VISA">Visas</SelectItem>
                  <SelectItem value="PRORROGA">Prórrogas</SelectItem>
                  <SelectItem value="USUARIO">Usuarios</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">La papelera está vacía</p>
              <p className="text-sm">No hay registros eliminados</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg ${tipoPapeleraColors[item.tipo]}`}
                    >
                      {tipoIconos[item.tipo]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {getItemTitle(item)}
                        </span>
                        <Badge
                          variant="outline"
                          className={tipoPapeleraColors[item.tipo]}
                        >
                          {tipoPapeleraLabels[item.tipo]}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Eliminado por {item.nombreUsuario || item.eliminadoPor}{" "}
                        el {formatDate(item.createdAt)}
                      </div>
                      {item.motivo && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Motivo: {item.motivo}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                        >
                          Ver detalles
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        {/* Botón de cerrar estilo macOS */}
                        <DialogClose className="absolute right-4 top-4 z-10 outline-none">
                          <div className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-sm cursor-pointer">
                            <X
                              className="w-4 h-4 text-white pointer-events-none"
                              strokeWidth={2.5}
                            />
                          </div>
                        </DialogClose>

                        <DialogHeader className="pb-4 border-b pr-10">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2.5 rounded-xl ${tipoPapeleraColors[item.tipo]}`}
                            >
                              {tipoIconos[item.tipo]}
                            </div>
                            <div>
                              <DialogTitle className="text-lg font-semibold">
                                {getItemTitle(item)}
                              </DialogTitle>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {tipoPapeleraLabels[item.tipo]} • Eliminado el{" "}
                                {formatDate(item.createdAt)}
                              </p>
                            </div>
                          </div>
                        </DialogHeader>

                        <div className="space-y-6 py-2">
                          {/* Información principal */}
                          <RecordDetailsView
                            tipo={item.tipo}
                            datos={item.datos}
                          />

                          {/* Información de eliminación */}
                          <div className="pt-4 border-t">
                            <h4 className="text-sm font-medium text-muted-foreground mb-3">
                              Información de eliminación
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Eliminado por
                                </span>
                                <span className="font-medium">
                                  {item.nombreUsuario || item.eliminadoPor}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Fecha
                                </span>
                                <span>{formatDate(item.createdAt)}</span>
                              </div>
                              {item.motivo && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Motivo
                                  </span>
                                  <span className="text-right max-w-[200px]">
                                    {item.motivo}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestaurar(item)}
                      className="text-blue-600"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restaurar
                    </Button>

                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminarPermanente(item)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

import { api } from "./api";
import { Profesor, ProfesorFilters, ApiResponse } from "@/types";

export interface CreateProfesorData {
  ci: string;
  nombre: string;
  apellidos: string;
  edad?: number;
  sexo?: string;
  colorPiel?: string;
  colorOjos?: string;
  colorPelo?: string;
  estatura?: number;
  peso?: number;
  senasParticulares?: string;
  direccion?: string;
  provinciaId?: string;
  municipioId?: string;
  cargoId?: string;
  especialidadId?: string;
  categoriaDocenteId?: string;
  anosExperiencia?: number;
  estadoCivil?: string;
  cantidadHijos?: number;
  telefonoFijo?: string;
  telefonoMovil?: string;
  email?: string;
  nivelIngles?: string;
  anoGraduado?: number;
  centroGraduacion?: string;
  notaPromedio?: number;
  estadoPotencial?: string;
  observaciones?: string;
  // Campos adicionales
  nombrePadre?: string;
  nombreMadre?: string;
  conyuge?: string;
  militanciaPCC?: boolean;
  militanciaUJC?: boolean;
  accionColaboracion?: string;
  familiarAvisoNombre?: string;
  familiarAvisoTelefono?: string;
  // Campos X-22 (Formulario de Solicitud de Pasaporte)
  fechaNacimiento?: string;
  paisNacimientoId?: string;
  ciudadEnElExtranjero?: string;
  calle?: string;
  numero?: string;
  entreCalles?: string;
  apto?: string;
  cpa?: string;
  finca?: string;
  localidad?: string;
  circunscripcion?: string;
  carretera?: string;
  km?: string;
}

// Función para limpiar datos antes de enviar al backend
function cleanProfesorData(data: CreateProfesorData): CreateProfesorData {
  const cleaned = { ...data };

  // Convertir strings vacíos a undefined para campos numéricos
  if (cleaned.estatura === 0 || cleaned.estatura === ("" as any)) {
    delete (cleaned as any).estatura;
  }
  if (cleaned.peso === 0 || cleaned.peso === ("" as any)) {
    delete (cleaned as any).peso;
  }
  if (cleaned.anoGraduado === 0) {
    delete (cleaned as any).anoGraduado;
  }
  if (cleaned.notaPromedio === 0) {
    delete (cleaned as any).notaPromedio;
  }

  // Eliminar campos de dirección X-22 si están vacíos
  const camposDireccion = [
    "calle",
    "numero",
    "entreCalles",
    "apto",
    "localidad",
    "cpa",
    "finca",
    "circunscripcion",
    "carretera",
    "km",
    "ciudadEnElExtranjero",
  ];
  camposDireccion.forEach((campo) => {
    if ((cleaned as any)[campo] === "") {
      delete (cleaned as any)[campo];
    }
  });

  // Eliminar campos opcionales vacíos
  if (cleaned.colorPiel === "") delete (cleaned as any).colorPiel;
  if (cleaned.colorOjos === "") delete (cleaned as any).colorOjos;
  if (cleaned.colorPelo === "") delete (cleaned as any).colorPelo;
  if (cleaned.senasParticulares === "")
    delete (cleaned as any).senasParticulares;
  if (cleaned.centroGraduacion === "") delete (cleaned as any).centroGraduacion;
  if (cleaned.observaciones === "") delete (cleaned as any).observaciones;
  if (cleaned.nombrePadre === "") delete (cleaned as any).nombrePadre;
  if (cleaned.nombreMadre === "") delete (cleaned as any).nombreMadre;
  if (cleaned.conyuge === "") delete (cleaned as any).conyuge;
  if (cleaned.accionColaboracion === "")
    delete (cleaned as any).accionColaboracion;
  if (cleaned.familiarAvisoNombre === "")
    delete (cleaned as any).familiarAvisoNombre;
  if (cleaned.familiarAvisoTelefono === "")
    delete (cleaned as any).familiarAvisoTelefono;

  return cleaned;
}

export const profesoresService = {
  async getAll(
    filters: ProfesorFilters = {},
  ): Promise<ApiResponse<Profesor[]>> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.provinciaId) params.append("provinciaId", filters.provinciaId);
    if (filters.estadoPotencial)
      params.append("estadoPotencial", filters.estadoPotencial);

    const query = params.toString();
    return api.get<ApiResponse<Profesor[]>>(
      `/profesores${query ? `?${query}` : ""}`,
    );
  },

  async getById(id: string): Promise<Profesor> {
    return api.get<Profesor>(`/profesores/${id}`);
  },

  async create(data: CreateProfesorData): Promise<Profesor> {
    const cleanedData = cleanProfesorData(data);
    return api.post<Profesor>("/profesores", cleanedData);
  },

  async update(id: string, data: CreateProfesorData): Promise<Profesor> {
    const cleanedData = cleanProfesorData(data);
    return api.put<Profesor>(`/profesores/${id}`, cleanedData);
  },

  async delete(id: string): Promise<void> {
    return api.delete(`/profesores/${id}`);
  },

  async importarExcel(file: File): Promise<{
    creados: number;
    actualizados: number;
    errores: { fila: number; error: string }[];
  }> {
    const formData = new FormData();
    formData.append("archivo", file);

    return api.upload("/profesores/importar-excel", formData);
  },

  async importarPotencial(file: File): Promise<{
    hojasProcesadas: string[];
    profesoresCreados: number;
    profesoresActualizados: number;
    errores: { fila: number; hoja: string; error: string }[];
  }> {
    const formData = new FormData();
    formData.append("archivo", file);

    return api.upload("/profesores/importar-potencial", formData);
  },

  async exportarExcel(filters: ProfesorFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.provinciaId) params.append("provinciaId", filters.provinciaId);
    if (filters.estadoPotencial)
      params.append("estadoPotencial", filters.estadoPotencial);

    const query = params.toString();
    return api.download(
      `/profesores/exportar/excel${query ? `?${query}` : ""}`,
    );
  },

  async generarReportePdf(filters: ProfesorFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.provinciaId) params.append("provinciaId", filters.provinciaId);
    if (filters.estadoPotencial)
      params.append("estadoPotencial", filters.estadoPotencial);

    const query = params.toString();
    return api.download(`/profesores/reporte/pdf${query ? `?${query}` : ""}`);
  },
};

// ============================================
// AUTH TYPES
// ============================================

export interface User {
  id: string;
  username: string;
  email: string;
  nombre: string;
  apellidos: string;
  rol: "ADMIN" | "OPERADOR" | "CONSULTA";
  ultimoAcceso?: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

// ============================================
// FIRMAS AUTORIZADAS
// ============================================

export interface FirmaAutorizada {
  id: string;
  nombre: string;
  apellidos: string;
  cargo: string;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ACTAS DE EXTRANJERIA
// ============================================

export interface ActaExtranjeria {
  id: string;
  numeroActa: string;
  ano: number;
  profesorId: string;
  fechaActa: string;
  funcion: string;
  paisDestinoId: string;
  observaciones?: string;
  documentoUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  profesor?: {
    id: string;
    nombre: string;
    apellidos: string;
    ci: string;
  };
  paisDestino?: {
    id: string;
    nombre: string;
    nombreEs: string;
  };
}

// ============================================
// NOMENCLADORES
// ============================================

export interface Provincia {
  id: string;
  codigo: string;
  nombre: string;
  municipios?: Municipio[];
}

export interface Municipio {
  id: string;
  codigo: string;
  nombre: string;
  provinciaId: string;
  provincia?: Provincia;
}

export interface Pais {
  id: string;
  codigo: string;
  nombre: string;
  nombreEs: string;
}

export interface Cargo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
}

export interface Especialidad {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
}

export interface CategoriaDocente {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
}

// ============================================
// PROFESORES
// ============================================

export type Sexo = "MASCULINO" | "FEMENINO";
export type EstadoCivil =
  | "SOLTERO"
  | "CASADO"
  | "DIVORCIADO"
  | "VIUDO"
  | "UNION_ESTABLE";
export type NivelIngles = "BASICO" | "INTERMEDIO" | "AVANZADO" | "NATIVO";
export type EstadoPotencial =
  | "ACTIVO"
  | "EN_PROCESO"
  | "CONTRATADO"
  | "BAJA"
  | "SUSPENDIDO";

export interface Profesor {
  id: string;
  ci: string;
  nombre: string;
  apellidos: string;
  edad: number;
  sexo: Sexo;
  colorPiel?: string;
  colorOjos?: string;
  colorPelo?: string;
  estatura?: number;
  peso?: number;
  senasParticulares?: string;
  direccion?: string;
  provinciaId: string;
  municipioId: string;
  cargoId?: string;
  especialidadId?: string;
  categoriaDocenteId?: string;
  anosExperiencia: number;
  estadoCivil: EstadoCivil;
  cantidadHijos: number;
  telefonoFijo?: string;
  telefonoMovil?: string;
  email?: string;
  nivelIngles: NivelIngles;
  anoGraduado?: number;
  centroGraduacion?: string;
  notaPromedio?: number;
  estadoPotencial: EstadoPotencial;
  observaciones?: string;
  nombrePadre?: string;
  nombreMadre?: string;
  conyuge?: string;
  militanciaPCC: boolean;
  militanciaUJC: boolean;
  accionColaboracion?: string;
  familiarAvisoNombre?: string;
  familiarAvisoTelefono?: string;
  // Campos X-22 (Formulario de Solicitud de Pasaporte)
  fechaNacimiento?: string;
  paisNacimientoId?: string;
  paisNacimiento?: Pais;
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
  createdAt: string;
  updatedAt: string;
  provincia?: Provincia;
  municipio?: Municipio;
  cargo?: Cargo;
  especialidad?: Especialidad;
  categoriaDocente?: CategoriaDocente;
  _count?: {
    pasaportes: number;
    contratos: number;
  };
}

// ============================================
// PASAPORTES Y VISAS
// ============================================

export type TipoPasaporte = "ORDINARIO" | "OFICIAL" | "DIPLOMATICO";

export interface Pasaporte {
  id: string;
  profesorId: string;
  tipo: TipoPasaporte;
  numero: string;
  numeroArchivo?: string;
  fechaExpedicion: string;
  fechaVencimiento: string;
  lugarExpedicion?: string;
  observaciones?: string;
  activo: boolean;
  createdAt: string;
  profesor?: Profesor;
  visas?: Visa[];
  _count?: {
    visas: number;
  };
}

export interface Visa {
  id: string;
  pasaporteId: string;
  tipo: string;
  numero?: string;
  fechaEmision: string;
  fechaVencimiento: string;
  paisEmision: string;
  numeroEntradas: number;
  duracionDias: number;
  observaciones?: string;
  activa: boolean;
  createdAt: string;
  pasaporte?: Pasaporte;
}

// ============================================
// CONTRATOS Y PRORROGAS
// ============================================

export type EstadoContrato = "ACTIVO" | "PRORROGADO" | "CERRADO" | "CANCELADO";

export interface Contrato {
  id: string;
  numeroConsecutivo: number;
  ano: number;
  profesorId: string;
  paisId: string;
  fechaInicio: string;
  fechaFin: string;
  funcion: string;
  centroTrabajo: string;
  direccionTrabajo?: string;
  salarioMensual?: string;
  moneda: string;
  estado: EstadoContrato;
  fechaFirma?: string;
  fechaRecepcion?: string;
  fechaCierre?: string;
  motivoCierre?: string;
  documentoUrl?: string;
  observaciones?: string;
  createdAt: string;
  profesor?: Profesor;
  pais?: Pais;
  prorrogas?: Prorroga[];
  _count?: {
    prorrogas: number;
  };
}

export interface Prorroga {
  id: string;
  contratoId: string;
  numeroProrroga: number;
  fechaDesde: string;
  fechaHasta: string;
  motivo: string;
  observaciones?: string;
  documentoUrl?: string;
  createdAt: string;
  contrato?: Contrato;
}

// ============================================
// FILTERS
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ProfesorFilters extends PaginationParams {
  search?: string;
  provinciaId?: string;
  estadoPotencial?: EstadoPotencial;
}

export interface PasaporteFilters extends PaginationParams {
  profesorId?: string;
  numero?: string;
  estado?: "vencidos" | "proximos" | "vigentes";
}

export interface ContratoFilters extends PaginationParams {
  profesorId?: string;
  paisId?: string;
  estado?: EstadoContrato;
  ano?: number;
}

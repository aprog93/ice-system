import { api } from "./api";
import { Contrato, Prorroga, ContratoFilters, ApiResponse } from "@/types";

export interface CreateContratoData {
  profesorId: string;
  paisId: string;
  fechaInicio: string;
  fechaFin: string;
  funcion: string;
  centroTrabajo: string;
  direccionTrabajo?: string;
  salarioMensual?: string;
  moneda?: string;
  observaciones?: string;
}

export interface CreateProrrogaData {
  contratoId: string;
  fechaDesde: string;
  fechaHasta: string;
  motivo: string;
  observaciones?: string;
}

export interface CerrarContratoData {
  fechaCierre: string;
  motivoCierre: string;
}

export const contratosService = {
  async getAll(
    filters: ContratoFilters = {},
  ): Promise<ApiResponse<Contrato[]>> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.profesorId) params.append("profesorId", filters.profesorId);
    if (filters.paisId) params.append("paisId", filters.paisId);
    if (filters.estado) params.append("estado", filters.estado);
    if (filters.ano) params.append("ano", filters.ano.toString());

    const query = params.toString();
    return api.get<ApiResponse<Contrato[]>>(
      `/contratos${query ? `?${query}` : ""}`,
    );
  },

  async getById(id: string): Promise<Contrato> {
    return api.get<Contrato>(`/contratos/${id}`);
  },

  async create(data: CreateContratoData): Promise<Contrato> {
    return api.post<Contrato>("/contratos", data);
  },

  async update(id: string, data: CreateContratoData): Promise<Contrato> {
    return api.put<Contrato>(`/contratos/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return api.delete(`/contratos/${id}`);
  },

  async cerrar(id: string, data: CerrarContratoData): Promise<Contrato> {
    return api.post<Contrato>(`/contratos/${id}/cerrar`, data);
  },

  async exportarExcel(filters: ContratoFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters.profesorId) params.append("profesorId", filters.profesorId);
    if (filters.paisId) params.append("paisId", filters.paisId);
    if (filters.estado) params.append("estado", filters.estado);
    if (filters.ano) params.append("ano", filters.ano.toString());

    const query = params.toString();
    return api.download(`/contratos/exportar/excel${query ? `?${query}` : ""}`);
  },

  async generarReportePdf(filters: ContratoFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters.profesorId) params.append("profesorId", filters.profesorId);
    if (filters.paisId) params.append("paisId", filters.paisId);
    if (filters.estado) params.append("estado", filters.estado);
    if (filters.ano) params.append("ano", filters.ano.toString());

    const query = params.toString();
    return api.download(`/contratos/reporte/pdf${query ? `?${query}` : ""}`);
  },
};

export const prorrogasService = {
  async getAll(
    filters: { contratoId?: string; page?: number; limit?: number } = {},
  ): Promise<ApiResponse<Prorroga[]>> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.contratoId) params.append("contratoId", filters.contratoId);

    const query = params.toString();
    return api.get<ApiResponse<Prorroga[]>>(
      `/prorrogas${query ? `?${query}` : ""}`,
    );
  },

  async getById(id: string): Promise<Prorroga> {
    return api.get<Prorroga>(`/prorrogas/${id}`);
  },

  async create(data: CreateProrrogaData): Promise<Prorroga> {
    return api.post<Prorroga>("/prorrogas", data);
  },

  async update(id: string, data: CreateProrrogaData): Promise<Prorroga> {
    return api.put<Prorroga>(`/prorrogas/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return api.delete(`/prorrogas/${id}`);
  },

  async exportarExcel(filters: { contratoId?: string } = {}): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters.contratoId) params.append("contratoId", filters.contratoId);

    const query = params.toString();
    return api.download(`/prorrogas/exportar/excel${query ? `?${query}` : ""}`);
  },

  async generarReportePdf(
    filters: { contratoId?: string } = {},
  ): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters.contratoId) params.append("contratoId", filters.contratoId);

    const query = params.toString();
    return api.download(`/prorrogas/reporte/pdf${query ? `?${query}` : ""}`);
  },
};

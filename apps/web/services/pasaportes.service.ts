import { api } from "./api";
import { Pasaporte, Visa, PasaporteFilters, ApiResponse } from "@/types";

export interface CreatePasaporteData {
  profesorId: string;
  tipo: string;
  numero: string;
  fechaExpedicion: string;
  fechaVencimiento: string;
  lugarExpedicion?: string;
  observaciones?: string;
}

export interface CreateVisaData {
  pasaporteId: string;
  tipo: string;
  numero?: string;
  fechaEmision: string;
  fechaVencimiento: string;
  paisEmision: string;
  numeroEntradas?: number;
  duracionDias?: number;
  observaciones?: string;
}

export const pasaportesService = {
  async getAll(
    filters: PasaporteFilters = {},
  ): Promise<ApiResponse<Pasaporte[]>> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.profesorId) params.append("profesorId", filters.profesorId);
    if (filters.numero) params.append("numero", filters.numero);
    if (filters.estado) params.append("estado", filters.estado);

    const query = params.toString();
    return api.get<ApiResponse<Pasaporte[]>>(
      `/pasaportes${query ? `?${query}` : ""}`,
    );
  },

  async getById(id: string): Promise<Pasaporte> {
    return api.get<Pasaporte>(`/pasaportes/${id}`);
  },

  async create(data: CreatePasaporteData): Promise<Pasaporte> {
    return api.post<Pasaporte>("/pasaportes", data);
  },

  async update(id: string, data: CreatePasaporteData): Promise<Pasaporte> {
    return api.put<Pasaporte>(`/pasaportes/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return api.delete(`/pasaportes/${id}`);
  },

  async getAlertas(): Promise<{
    vencidos: Pasaporte[];
    proximos30: Pasaporte[];
    proximos90: Pasaporte[];
    resumen: {
      totalVencidos: number;
      totalProximos30: number;
      totalProximos90: number;
    };
  }> {
    return api.get("/pasaportes/alertas/vencimientos");
  },

  async generarSolicitud(
    pasaporteId: string,
    firmante?: string,
    cargoFirmante?: string,
  ): Promise<Blob> {
    return api.download("/pasaportes/generar-solicitud", {
      method: "POST",
      body: JSON.stringify({ pasaporteId, firmante, cargoFirmante }),
    });
  },

  async exportarExcel(filters: PasaporteFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters.profesorId) params.append("profesorId", filters.profesorId);
    if (filters.numero) params.append("numero", filters.numero);
    if (filters.estado) params.append("estado", filters.estado);

    const query = params.toString();
    return api.download(
      `/pasaportes/exportar/excel${query ? `?${query}` : ""}`,
    );
  },

  async generarReportePdf(filters: PasaporteFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters.profesorId) params.append("profesorId", filters.profesorId);
    if (filters.numero) params.append("numero", filters.numero);
    if (filters.estado) params.append("estado", filters.estado);

    const query = params.toString();
    return api.download(`/pasaportes/reporte/pdf${query ? `?${query}` : ""}`);
  },

  async generarFormularioX22(id: string): Promise<Blob> {
    return api.download(`/pasaportes/${id}/formulario-x22`, {
      method: "POST",
    });
  },

  async generarActaExtranjeria(id: string): Promise<Blob> {
    return api.download(`/pasaportes/${id}/acta-extranjeria`, {
      method: "POST",
    });
  },
};

export const visasService = {
  async getAll(
    filters: {
      pasaporteId?: string;
      estado?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<ApiResponse<Visa[]>> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.pasaporteId) params.append("pasaporteId", filters.pasaporteId);
    if (filters.estado) params.append("estado", filters.estado);

    const query = params.toString();
    return api.get<ApiResponse<Visa[]>>(`/visas${query ? `?${query}` : ""}`);
  },

  async getById(id: string): Promise<Visa> {
    return api.get<Visa>(`/visas/${id}`);
  },

  async create(data: CreateVisaData): Promise<Visa> {
    return api.post<Visa>("/visas", data);
  },

  async update(id: string, data: CreateVisaData): Promise<Visa> {
    return api.put<Visa>(`/visas/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return api.delete(`/visas/${id}`);
  },
};

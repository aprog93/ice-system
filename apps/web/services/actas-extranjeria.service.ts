import { api } from "./api";
import type { ActaExtranjeria } from "@/types";

export interface CreateActaExtranjeriaData {
  numeroActa: string;
  ano: number;
  profesorId: string;
  fechaActa: string;
  funcion: string;
  paisDestinoId: string;
  observaciones?: string;
}

export interface UpdateActaExtranjeriaData extends CreateActaExtranjeriaData {}

export interface ActaExtranjeriaFilters {
  search?: string;
  profesorId?: string;
  ano?: number;
  page?: number;
  limit?: number;
}

export interface ActasResponse {
  data: ActaExtranjeria[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const actasExtranjeriaService = {
  getAll: async (filters?: ActaExtranjeriaFilters): Promise<ActasResponse> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.profesorId) params.append("profesorId", filters.profesorId);
    if (filters?.ano) params.append("ano", filters.ano.toString());
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    return api.get<ActasResponse>(`/actas-extranjeria?${params.toString()}`);
  },

  getById: async (id: string): Promise<ActaExtranjeria> => {
    const response = await api.get<{ data: ActaExtranjeria }>(
      `/actas-extranjeria/${id}`,
    );
    return response.data;
  },

  getNextNumeroActa: async (
    ano?: number,
  ): Promise<{ numeroActa: string; ano: number }> => {
    const params = ano ? `?ano=${ano}` : "";
    const response = await api.get<{ numeroActa: string; ano: number }>(
      `/actas-extranjeria/proximo-numero${params}`,
    );
    return response;
  },

  create: async (data: CreateActaExtranjeriaData): Promise<ActaExtranjeria> => {
    const response = await api.post<{ data: ActaExtranjeria }>(
      "/actas-extranjeria",
      data,
    );
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateActaExtranjeriaData,
  ): Promise<ActaExtranjeria> => {
    const response = await api.put<{ data: ActaExtranjeria }>(
      `/actas-extranjeria/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/actas-extranjeria/${id}`);
  },

  downloadPDF: async (
    id: string,
    numeroActa: string,
    ano: number,
  ): Promise<void> => {
    const response = await api.get<Blob>(`/actas-extranjeria/${id}/pdf`);

    // Crear blob y descargar
    const blob = new Blob([response], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Acta_${numeroActa}_${ano}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

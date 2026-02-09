import { api } from "./api";
import { Prorroga, ApiResponse } from "@/types";

export interface CreateProrrogaData {
  contratoId: string;
  fechaDesde: string;
  fechaHasta: string;
  motivo: string;
  observaciones?: string;
}

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

  async generarSuplemento(id: string): Promise<Blob> {
    return api.download(`/prorrogas/${id}/generar-suplemento`, {
      method: "POST",
    });
  },
};

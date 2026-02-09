import { api } from "./api";
import type { FirmaAutorizada } from "@/types";

export interface CreateFirmaAutorizadaData {
  nombre: string;
  apellidos: string;
  cargo: string;
  activa?: boolean;
}

export interface UpdateFirmaAutorizadaData extends CreateFirmaAutorizadaData {}

export const firmasAutorizadasService = {
  getAll: async (): Promise<FirmaAutorizada[]> => {
    return api.get<FirmaAutorizada[]>("/firmas-autorizadas");
  },

  getAllActivas: async (): Promise<FirmaAutorizada[]> => {
    return api.get<FirmaAutorizada[]>("/firmas-autorizadas/activas");
  },

  getForDocumento: async (): Promise<{
    firma1: FirmaAutorizada;
    firma2: FirmaAutorizada;
  }> => {
    return api.get<{ firma1: FirmaAutorizada; firma2: FirmaAutorizada }>(
      "/firmas-autorizadas/para-documento",
    );
  },

  getById: async (id: string): Promise<FirmaAutorizada> => {
    return api.get<FirmaAutorizada>(`/firmas-autorizadas/${id}`);
  },

  create: async (data: CreateFirmaAutorizadaData): Promise<FirmaAutorizada> => {
    return api.post<FirmaAutorizada>("/firmas-autorizadas", data);
  },

  update: async (
    id: string,
    data: UpdateFirmaAutorizadaData,
  ): Promise<FirmaAutorizada> => {
    return api.put<FirmaAutorizada>(`/firmas-autorizadas/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/firmas-autorizadas/${id}`);
  },
};

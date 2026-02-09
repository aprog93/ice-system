import { api } from "./api";

export interface PapeleraItem {
  id: string;
  tipo: "PROFESOR" | "CONTRATO" | "PASAPORTE" | "VISA" | "PRORROGA" | "USUARIO";
  registroId: string;
  datos: any;
  eliminadoPor: string;
  nombreUsuario?: string;
  motivo?: string;
  createdAt: string;
  restoredAt?: string;
}

export interface PapeleraFilters {
  tipo?: string;
  page?: number;
  limit?: number;
}

export const papeleraService = {
  async getAll(filters: PapeleraFilters = {}) {
    const params = new URLSearchParams();

    if (filters.tipo) params.append("tipo", filters.tipo);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const query = params.toString();
    return api.get<{ data: PapeleraItem[]; meta: any }>(
      `/papelera${query ? `?${query}` : ""}`,
    );
  },

  async getById(id: string) {
    return api.get<PapeleraItem>(`/papelera/${id}`);
  },

  async restaurar(id: string) {
    return api.post<{ id: string; restoredAt: string }>(
      `/papelera/${id}/restaurar`,
    );
  },

  async eliminarPermanente(id: string) {
    return api.delete(`/papelera/${id}`);
  },

  async vaciarPapelera() {
    return api.post("/papelera/vaciar");
  },
};

export const tipoPapeleraLabels: Record<string, string> = {
  PROFESOR: "Profesor",
  CONTRATO: "Contrato",
  PASAPORTE: "Pasaporte",
  VISA: "Visa",
  PRORROGA: "Prórroga",
  USUARIO: "Usuario",
};

export const tipoPapeleraColors: Record<string, string> = {
  PROFESOR: "bg-blue-100 text-blue-800",
  CONTRATO: "bg-green-100 text-green-800",
  PASAPORTE: "bg-purple-100 text-purple-800",
  VISA: "bg-yellow-100 text-yellow-800",
  PRORROGA: "bg-orange-100 text-orange-800",
  USUARIO: "bg-red-100 text-red-800",
};

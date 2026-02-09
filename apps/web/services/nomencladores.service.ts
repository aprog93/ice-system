import { api } from "./api";
import {
  Provincia,
  Municipio,
  Pais,
  Cargo,
  Especialidad,
  CategoriaDocente,
} from "@/types";

export const nomencladoresService = {
  async getProvincias(): Promise<Provincia[]> {
    return api.get<Provincia[]>("/nomencladores/provincias");
  },

  async getMunicipios(provinciaId?: string): Promise<Municipio[]> {
    const query = provinciaId ? `?provinciaId=${provinciaId}` : "";
    return api.get<Municipio[]>(`/nomencladores/municipios${query}`);
  },

  async getPaises(): Promise<Pais[]> {
    return api.get<Pais[]>("/nomencladores/paises");
  },

  async getCargos(): Promise<Cargo[]> {
    return api.get<Cargo[]>("/nomencladores/cargos");
  },

  async getEspecialidades(): Promise<Especialidad[]> {
    return api.get<Especialidad[]>("/nomencladores/especialidades");
  },

  async getCategoriasDocentes(): Promise<CategoriaDocente[]> {
    return api.get<CategoriaDocente[]>("/nomencladores/categorias-docentes");
  },
};

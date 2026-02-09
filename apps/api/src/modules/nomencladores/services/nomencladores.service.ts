import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class NomencladoresService {
  constructor(private prisma: PrismaService) {}

  async getProvincias() {
    return this.prisma.provincia.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        municipios: {
          where: { activo: true },
          orderBy: { nombre: 'asc' },
        },
      },
    });
  }

  async getMunicipios() {
    return this.prisma.municipio.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        provincia: true,
      },
    });
  }

  async getMunicipiosByProvincia(provinciaId: string) {
    console.log('🔍 Buscando municipios para provinciaId:', provinciaId);
    const result = await this.prisma.municipio.findMany({
      where: {
        provinciaId,
        activo: true,
      },
      orderBy: { nombre: 'asc' },
    });
    console.log('🔍 Municipios encontrados:', result.length);
    if (result.length === 0) {
      // Verificar si existe la provincia
      const provincia = await this.prisma.provincia.findUnique({
        where: { id: provinciaId },
      });
      console.log('🔍 Provincia existe?:', !!provincia);
      if (provincia) {
        // Buscar todos los municipios para ver qué IDs de provincia existen
        const allMunicipios = await this.prisma.municipio.findMany({
          take: 5,
          select: { id: true, nombre: true, provinciaId: true },
        });
        console.log('🔍 Muestra de municipios en BD:', allMunicipios);
      }
    }
    return result;
  }

  async getPaises() {
    return this.prisma.pais.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async getCargos() {
    return this.prisma.cargo.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async getEspecialidades() {
    return this.prisma.especialidad.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async getCategoriasDocentes() {
    return this.prisma.categoriaDocente.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }
}

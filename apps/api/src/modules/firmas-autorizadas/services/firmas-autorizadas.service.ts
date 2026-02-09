import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateFirmaAutorizadaDto,
  UpdateFirmaAutorizadaDto,
  FirmaAutorizadaFilterDto,
} from '../dto/firma-autorizada.dto';

@Injectable()
export class FirmasAutorizadasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: FirmaAutorizadaFilterDto) {
    const where: any = {};

    if (filters?.activa !== undefined) {
      where.activa = filters.activa;
    }

    if (filters?.search) {
      const searchTerm = filters.search.toUpperCase();
      where.OR = [
        { nombre: { contains: searchTerm } },
        { apellidos: { contains: searchTerm } },
        { cargo: { contains: searchTerm } },
      ];
    }

    return this.prisma.firmaAutorizada.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllActivas() {
    return this.prisma.firmaAutorizada.findMany({
      where: { activa: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string) {
    const firma = await this.prisma.firmaAutorizada.findUnique({
      where: { id },
    });

    if (!firma) {
      throw new NotFoundException('Firma autorizada no encontrada');
    }

    return firma;
  }

  async create(data: CreateFirmaAutorizadaDto) {
    // Convertir a mayúsculas
    const dataToSave = {
      ...data,
      nombre: data.nombre.toUpperCase(),
      apellidos: data.apellidos.toUpperCase(),
      cargo: data.cargo.toUpperCase(),
    };

    return this.prisma.firmaAutorizada.create({
      data: dataToSave,
    });
  }

  async update(id: string, data: UpdateFirmaAutorizadaDto) {
    await this.findById(id); // Verifica que existe

    // Convertir a mayúsculas
    const dataToSave: any = {};
    if (data.nombre) dataToSave.nombre = data.nombre.toUpperCase();
    if (data.apellidos) dataToSave.apellidos = data.apellidos.toUpperCase();
    if (data.cargo) dataToSave.cargo = data.cargo.toUpperCase();
    if (data.activa !== undefined) dataToSave.activa = data.activa;

    return this.prisma.firmaAutorizada.update({
      where: { id },
      data: dataToSave,
    });
  }

  async remove(id: string) {
    await this.findById(id); // Verifica que existe

    return this.prisma.firmaAutorizada.delete({
      where: { id },
    });
  }

  /**
   * Obtiene las primeras 2 firmas autorizadas activas
   * Usado para generar documentos
   */
  async getFirmasParaDocumento() {
    const firmas = await this.prisma.firmaAutorizada.findMany({
      where: { activa: true },
      orderBy: { createdAt: 'asc' },
      take: 2,
    });

    if (firmas.length < 2) {
      throw new NotFoundException(
        'Debe haber al menos 2 firmas autorizadas activas para generar documentos',
      );
    }

    return {
      firma1: firmas[0],
      firma2: firmas[1],
    };
  }
}

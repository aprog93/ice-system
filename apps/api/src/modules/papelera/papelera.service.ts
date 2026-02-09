import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { TipoRegistroPapelera } from '@prisma/client';

interface PapeleraFilters {
  tipo?: TipoRegistroPapelera;
  page?: number;
  limit?: number;
}

@Injectable()
export class PapeleraService {
  constructor(private prisma: PrismaService) {}

  /**
   * Mover un registro a la papelera
   */
  async moverAPapelera(
    tipo: TipoRegistroPapelera,
    registroId: string,
    datos: any,
    eliminadoPor: string,
    nombreUsuario?: string,
    motivo?: string,
  ) {
    // Verificar si ya está en la papelera
    const existente = await this.prisma.papelera.findFirst({
      where: { tipo, registroId, restoredAt: null },
    });

    if (existente) {
      throw new BadRequestException('Este registro ya está en la papelera');
    }

    // Guardar datos relacionados según el tipo
    let relacionados = null;

    if (tipo === TipoRegistroPapelera.PROFESOR) {
      // Obtener pasaportes y contratos del profesor
      const [pasaportes, contratos] = await Promise.all([
        this.prisma.pasaporte.findMany({
          where: { profesorId: registroId },
          include: { visas: true },
        }),
        this.prisma.contrato.findMany({
          where: { profesorId: registroId },
          include: { prorrogas: true },
        }),
      ]);

      relacionados = { pasaportes, contratos };
    }

    return this.prisma.papelera.create({
      data: {
        tipo,
        registroId,
        datos,
        relacionados: relacionados ? JSON.parse(JSON.stringify(relacionados)) : null,
        eliminadoPor,
        nombreUsuario,
        motivo,
      },
    });
  }

  /**
   * Listar registros en la papelera
   */
  async findAll(filters: PapeleraFilters) {
    const { tipo, page = 1, limit = 10 } = filters;

    const where = {
      restoredAt: null,
      ...(tipo && { tipo }),
    };

    const [items, total] = await Promise.all([
      this.prisma.papelera.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.papelera.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener un registro específico de la papelera
   */
  async findOne(id: string) {
    const item = await this.prisma.papelera.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Registro no encontrado en la papelera');
    }

    return item;
  }

  /**
   * Restaurar un registro desde la papelera
   */
  async restaurar(id: string, userId: string) {
    const item = await this.findOne(id);

    if (item.restoredAt) {
      throw new BadRequestException('Este registro ya ha sido restaurado');
    }

    // Restaurar según el tipo
    switch (item.tipo) {
      case TipoRegistroPapelera.PROFESOR:
        await this.restaurarProfesor(item);
        break;
      case TipoRegistroPapelera.CONTRATO:
        await this.restaurarContrato(item);
        break;
      case TipoRegistroPapelera.PASAPORTE:
        await this.restaurarPasaporte(item);
        break;
      case TipoRegistroPapelera.VISA:
        await this.restaurarVisa(item);
        break;
      case TipoRegistroPapelera.PRORROGA:
        await this.restaurarProrroga(item);
        break;
      default:
        throw new BadRequestException('Tipo de registro no soportado para restauración');
    }

    // Marcar como restaurado
    return this.prisma.papelera.update({
      where: { id },
      data: {
        restoredAt: new Date(),
        restoredBy: userId,
      },
    });
  }

  /**
   * Eliminar permanentemente un registro de la papelera
   */
  async eliminarPermanente(id: string) {
    const item = await this.findOne(id);

    return this.prisma.papelera.delete({
      where: { id },
    });
  }

  /**
   * Vaciar la papelera (eliminar todos los registros restaurados)
   */
  async vaciarPapelera() {
    return this.prisma.papelera.deleteMany({
      where: { restoredAt: { not: null } },
    });
  }

  // ============ MÉTODOS PRIVADOS DE RESTAURACIÓN ============

  private async restaurarProfesor(item: any) {
    const datos = item.datos;

    // Verificar si el profesor ya existe
    const existente = await this.prisma.profesor.findUnique({
      where: { id: item.registroId },
    });

    if (existente) {
      throw new BadRequestException('El profesor ya existe en la base de datos');
    }

    // Extraer solo campos escalares, excluyendo relaciones
    const {
      contratos,
      pasaportes,
      provincia,
      municipio,
      cargo,
      especialidad,
      categoriaDocente,
      ...datosLimpios
    } = datos;

    // Restaurar profesor
    await this.prisma.profesor.create({
      data: {
        ...datosLimpios,
        id: item.registroId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Restaurar datos relacionados si existen
    if (item.relacionados) {
      const { pasaportes, contratos } = item.relacionados as any;

      if (pasaportes?.length > 0) {
        for (const pasaporte of pasaportes) {
          await this.prisma.pasaporte.create({
            data: {
              ...pasaporte,
              id: pasaporte.id,
              profesorId: item.registroId,
              createdAt: new Date(pasaporte.createdAt),
              updatedAt: new Date(pasaporte.updatedAt),
            },
          });

          // Restaurar visas
          if (pasaporte.visas?.length > 0) {
            for (const visa of pasaporte.visas) {
              await this.prisma.visa.create({
                data: {
                  ...visa,
                  id: visa.id,
                  pasaporteId: pasaporte.id,
                  createdAt: new Date(visa.createdAt),
                  updatedAt: new Date(visa.updatedAt),
                },
              });
            }
          }
        }
      }

      if (contratos?.length > 0) {
        for (const contrato of contratos) {
          await this.prisma.contrato.create({
            data: {
              ...contrato,
              id: contrato.id,
              profesorId: item.registroId,
              createdAt: new Date(contrato.createdAt),
              updatedAt: new Date(contrato.updatedAt),
            },
          });

          // Restaurar prórrogas
          if (contrato.prorrogas?.length > 0) {
            for (const prorroga of contrato.prorrogas) {
              await this.prisma.prorroga.create({
                data: {
                  ...prorroga,
                  id: prorroga.id,
                  contratoId: contrato.id,
                  createdAt: new Date(prorroga.createdAt),
                  updatedAt: new Date(prorroga.updatedAt),
                },
              });
            }
          }
        }
      }
    }
  }

  private async restaurarContrato(item: any) {
    const datos = item.datos;

    await this.prisma.contrato.create({
      data: {
        ...datos,
        id: item.registroId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async restaurarPasaporte(item: any) {
    const datos = item.datos;

    await this.prisma.pasaporte.create({
      data: {
        ...datos,
        id: item.registroId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async restaurarVisa(item: any) {
    const datos = item.datos;

    await this.prisma.visa.create({
      data: {
        ...datos,
        id: item.registroId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async restaurarProrroga(item: any) {
    const datos = item.datos;

    await this.prisma.prorroga.create({
      data: {
        ...datos,
        id: item.registroId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateVisaDto, UpdateVisaDto, VisaFilterDto } from '../dto/visa.dto';
import { addDays, isBefore } from 'date-fns';

@Injectable()
export class VisasService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: VisaFilterDto) {
    const { pasaporteId, estado, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (pasaporteId) {
      where.pasaporteId = pasaporteId;
    }

    if (estado) {
      const hoy = new Date();
      const treintaDias = addDays(hoy, 30);

      switch (estado) {
        case 'vencidas':
          where.fechaVencimiento = { lt: hoy };
          break;
        case 'proximas':
          where.fechaVencimiento = {
            gte: hoy,
            lte: treintaDias,
          };
          break;
        case 'activas':
          where.fechaVencimiento = { gte: hoy };
          break;
      }
    }

    const [visas, total] = await Promise.all([
      this.prisma.visa.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaVencimiento: 'asc' },
        include: {
          pasaporte: {
            include: {
              profesor: {
                select: {
                  id: true,
                  ci: true,
                  nombre: true,
                  apellidos: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.visa.count({ where }),
    ]);

    return {
      data: visas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const visa = await this.prisma.visa.findUnique({
      where: { id },
      include: {
        pasaporte: {
          include: {
            profesor: {
              select: {
                id: true,
                ci: true,
                nombre: true,
                apellidos: true,
              },
            },
          },
        },
      },
    });

    if (!visa) {
      throw new NotFoundException('Visa no encontrada');
    }

    return visa;
  }

  async create(createDto: CreateVisaDto, userId: string) {
    // Check if pasaporte exists
    const pasaporte = await this.prisma.pasaporte.findUnique({
      where: { id: createDto.pasaporteId },
    });

    if (!pasaporte || !pasaporte.activo) {
      throw new NotFoundException('Pasaporte no encontrado');
    }

    // Validate dates
    if (isBefore(createDto.fechaVencimiento, createDto.fechaEmision)) {
      throw new BadRequestException(
        'La fecha de vencimiento debe ser posterior a la fecha de emisión',
      );
    }

    const { pasaporteId, duracionDias, numeroEntradas, ...rest } = createDto;

    return this.prisma.visa.create({
      data: {
        ...rest,
        tipo: createDto.tipo.toUpperCase(),
        paisEmision: createDto.paisEmision.toUpperCase(),
        duracionDias: duracionDias || 30,
        numeroEntradas: numeroEntradas || 1,
        pasaporte: { connect: { id: pasaporteId } },
      },
      include: {
        pasaporte: {
          include: {
            profesor: {
              select: {
                id: true,
                ci: true,
                nombre: true,
                apellidos: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, updateDto: UpdateVisaDto, userId: string) {
    const visa = await this.prisma.visa.findUnique({
      where: { id },
    });

    if (!visa) {
      throw new NotFoundException('Visa no encontrada');
    }

    // Validate dates
    if (isBefore(updateDto.fechaVencimiento, updateDto.fechaEmision)) {
      throw new BadRequestException(
        'La fecha de vencimiento debe ser posterior a la fecha de emisión',
      );
    }

    return this.prisma.visa.update({
      where: { id },
      data: {
        ...updateDto,
        tipo: updateDto.tipo.toUpperCase(),
        paisEmision: updateDto.paisEmision.toUpperCase(),
      },
      include: {
        pasaporte: {
          include: {
            profesor: {
              select: {
                id: true,
                ci: true,
                nombre: true,
                apellidos: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string) {
    const visa = await this.prisma.visa.findUnique({
      where: { id },
    });

    if (!visa) {
      throw new NotFoundException('Visa no encontrada');
    }

    await this.prisma.visa.delete({
      where: { id },
    });
  }
}

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateActaExtranjeriaDto,
  UpdateActaExtranjeriaDto,
  ActaExtranjeriaFilterDto,
} from '../dto/acta-extranjeria.dto';

@Injectable()
export class ActasExtranjeriaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: ActaExtranjeriaFilterDto) {
    const where: any = {};

    if (filters?.profesorId) {
      where.profesorId = filters.profesorId;
    }

    if (filters?.ano) {
      where.ano = filters.ano;
    }

    if (filters?.search) {
      where.numeroActa = {
        contains: filters.search.toUpperCase(),
      };
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const [actas, total] = await Promise.all([
      this.prisma.actaExtranjeria.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaActa: 'desc' },
        include: {
          profesor: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              ci: true,
            },
          },
          paisDestino: {
            select: {
              id: true,
              nombre: true,
              nombreEs: true,
            },
          },
        },
      }),
      this.prisma.actaExtranjeria.count({ where }),
    ]);

    return {
      data: actas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const acta = await this.prisma.actaExtranjeria.findUnique({
      where: { id },
      include: {
        profesor: {
          include: {
            provincia: true,
            municipio: true,
            cargo: true,
            especialidad: true,
            categoriaDocente: true,
          },
        },
        paisDestino: true,
      },
    });

    if (!acta) {
      throw new NotFoundException('Acta de extranjería no encontrada');
    }

    return acta;
  }

  async create(data: CreateActaExtranjeriaDto, userId: string) {
    // Verificar que no exista un acta con el mismo número y año
    const existing = await this.prisma.actaExtranjeria.findUnique({
      where: {
        numeroActa_ano: {
          numeroActa: data.numeroActa,
          ano: data.ano,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un acta con el número ${data.numeroActa} del año ${data.ano}`,
      );
    }

    // Verificar que el profesor existe
    const profesor = await this.prisma.profesor.findUnique({
      where: { id: data.profesorId },
    });

    if (!profesor) {
      throw new NotFoundException('Profesor no encontrado');
    }

    // Verificar que el país existe
    const pais = await this.prisma.pais.findUnique({
      where: { id: data.paisDestinoId },
    });

    if (!pais) {
      throw new NotFoundException('País no encontrado');
    }

    // Convertir fecha string (YYYY-MM-DD) a DateTime ISO-8601
    const fechaActa = new Date(data.fechaActa + 'T00:00:00');

    return this.prisma.actaExtranjeria.create({
      data: {
        numeroActa: data.numeroActa,
        ano: data.ano,
        profesorId: data.profesorId,
        paisDestinoId: data.paisDestinoId,
        fechaActa: fechaActa,
        funcion: data.funcion.toUpperCase(),
        observaciones: data.observaciones?.toUpperCase(),
        createdBy: userId,
      },
      include: {
        profesor: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            ci: true,
          },
        },
        paisDestino: {
          select: {
            id: true,
            nombre: true,
            nombreEs: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateActaExtranjeriaDto, userId: string) {
    const existing = await this.findById(id);

    // Verificar que el nuevo número/año no esté en uso por otro acta
    if (data.numeroActa !== existing.numeroActa || data.ano !== existing.ano) {
      const duplicate = await this.prisma.actaExtranjeria.findUnique({
        where: {
          numeroActa_ano: {
            numeroActa: data.numeroActa,
            ano: data.ano,
          },
        },
      });

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `Ya existe un acta con el número ${data.numeroActa} del año ${data.ano}`,
        );
      }
    }

    // Convertir fecha string (YYYY-MM-DD) a DateTime ISO-8601 si se proporciona
    const updateData: any = {
      numeroActa: data.numeroActa,
      ano: data.ano,
      profesorId: data.profesorId,
      paisDestinoId: data.paisDestinoId,
      fechaActa: new Date(data.fechaActa + 'T00:00:00'),
      funcion: data.funcion.toUpperCase(),
      observaciones: data.observaciones?.toUpperCase(),
    };

    return this.prisma.actaExtranjeria.update({
      where: { id },
      data: updateData,
      include: {
        profesor: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            ci: true,
          },
        },
        paisDestino: {
          select: {
            id: true,
            nombre: true,
            nombreEs: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findById(id); // Verifica que existe

    return this.prisma.actaExtranjeria.delete({
      where: { id },
    });
  }

  async getNextNumeroActa(ano: number): Promise<string> {
    const lastActa = await this.prisma.actaExtranjeria.findFirst({
      where: { ano },
      orderBy: { numeroActa: 'desc' },
    });

    if (!lastActa) {
      return '001';
    }

    const lastNumero = parseInt(lastActa.numeroActa, 10);
    const nextNumero = lastNumero + 1;
    return nextNumero.toString().padStart(3, '0');
  }
}

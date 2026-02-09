import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreatePasaporteDto, UpdatePasaporteDto, PasaporteFilterDto } from '../dto/pasaporte.dto';
import { validarFormatoPasaporte, formatearPasaporte } from '@/common/utils/string.utils';
import { addDays, isBefore, isAfter } from 'date-fns';
import * as ExcelJS from 'exceljs';

@Injectable()
export class PasaportesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: PasaporteFilterDto) {
    const { profesorId, numero, estado, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { activo: true };

    if (profesorId) {
      where.profesorId = profesorId;
    }

    if (numero) {
      where.numero = { contains: numero.toUpperCase() };
    }

    if (estado) {
      const hoy = new Date();
      const treintaDias = addDays(hoy, 30);

      switch (estado) {
        case 'vencidos':
          where.fechaVencimiento = { lt: hoy };
          break;
        case 'proximos':
          where.fechaVencimiento = {
            gte: hoy,
            lte: treintaDias,
          };
          break;
        case 'vigentes':
          where.fechaVencimiento = { gt: treintaDias };
          break;
      }
    }

    const [pasaportes, total] = await Promise.all([
      this.prisma.pasaporte.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaVencimiento: 'asc' },
        include: {
          profesor: {
            select: {
              id: true,
              ci: true,
              nombre: true,
              apellidos: true,
            },
          },
          _count: {
            select: { visas: true },
          },
        },
      }),
      this.prisma.pasaporte.count({ where }),
    ]);

    return {
      data: pasaportes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const pasaporte = await this.prisma.pasaporte.findUnique({
      where: { id },
      include: {
        profesor: {
          select: {
            id: true,
            ci: true,
            nombre: true,
            apellidos: true,
            direccion: true,
            telefonoMovil: true,
            email: true,
          },
        },
        visas: {
          orderBy: { fechaVencimiento: 'desc' },
        },
      },
    });

    if (!pasaporte || !pasaporte.activo) {
      throw new NotFoundException('Pasaporte no encontrado');
    }

    return pasaporte;
  }

  async create(createDto: CreatePasaporteDto, userId: string) {
    // Validate formato pasaporte
    const numeroFormateado = formatearPasaporte(createDto.numero);
    if (!validarFormatoPasaporte(numeroFormateado)) {
      throw new BadRequestException(
        'El número de pasaporte debe tener el formato: letra + 6 números (ej: A123456)',
      );
    }

    // Check if profesor exists
    const profesor = await this.prisma.profesor.findUnique({
      where: { id: createDto.profesorId },
    });

    if (!profesor) {
      throw new NotFoundException('Profesor no encontrado');
    }

    // Check if pasaporte number already exists
    const existing = await this.prisma.pasaporte.findUnique({
      where: { numero: numeroFormateado },
    });

    if (existing) {
      throw new ConflictException('Ya existe un pasaporte con este número');
    }

    // Validate dates
    if (isBefore(createDto.fechaVencimiento, createDto.fechaExpedicion)) {
      throw new BadRequestException(
        'La fecha de vencimiento debe ser posterior a la fecha de expedición',
      );
    }

    // Generar número de archivo automáticamente
    // Formato: Inicial del primer apellido + consecutivo (ej: D-0012)
    const primerApellido = profesor.apellidos?.split(' ')[0] || 'A';
    const inicial = primerApellido.charAt(0).toUpperCase();

    // Buscar el último número de archivo con esta inicial
    const ultimoPasaporte = await this.prisma.pasaporte.findFirst({
      where: {
        numeroArchivo: {
          startsWith: inicial + '-',
        },
      },
      orderBy: {
        numeroArchivo: 'desc',
      },
    });

    let consecutivo = 1;
    if (ultimoPasaporte?.numeroArchivo) {
      const partes = ultimoPasaporte.numeroArchivo.split('-');
      if (partes.length === 2) {
        consecutivo = parseInt(partes[1]) + 1;
      }
    }

    const numeroArchivo = `${inicial}-${consecutivo.toString().padStart(4, '0')}`;

    return this.prisma.pasaporte.create({
      data: {
        ...createDto,
        numero: numeroFormateado,
        numeroArchivo,
        lugarExpedicion: createDto.lugarExpedicion?.toUpperCase(),
      },
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
    });
  }

  async update(id: string, updateDto: UpdatePasaporteDto, userId: string) {
    const pasaporte = await this.prisma.pasaporte.findUnique({
      where: { id },
    });

    if (!pasaporte || !pasaporte.activo) {
      throw new NotFoundException('Pasaporte no encontrado');
    }

    // Validate formato pasaporte if number is being changed
    const numeroFormateado = formatearPasaporte(updateDto.numero);
    if (!validarFormatoPasaporte(numeroFormateado)) {
      throw new BadRequestException(
        'El número de pasaporte debe tener el formato: letra + 6 números (ej: A123456)',
      );
    }

    // Check if new number already exists
    if (numeroFormateado !== pasaporte.numero) {
      const existing = await this.prisma.pasaporte.findUnique({
        where: { numero: numeroFormateado },
      });

      if (existing) {
        throw new ConflictException('Ya existe un pasaporte con este número');
      }
    }

    // Validate dates
    if (isBefore(updateDto.fechaVencimiento, updateDto.fechaExpedicion)) {
      throw new BadRequestException(
        'La fecha de vencimiento debe ser posterior a la fecha de expedición',
      );
    }

    return this.prisma.pasaporte.update({
      where: { id },
      data: {
        ...updateDto,
        numero: numeroFormateado,
        lugarExpedicion: updateDto.lugarExpedicion?.toUpperCase(),
      },
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
    });
  }

  async remove(id: string) {
    const pasaporte = await this.prisma.pasaporte.findUnique({
      where: { id },
    });

    if (!pasaporte || !pasaporte.activo) {
      throw new NotFoundException('Pasaporte no encontrado');
    }

    // Soft delete
    await this.prisma.pasaporte.update({
      where: { id },
      data: { activo: false },
    });
  }

  async getAlertasVencimientos() {
    const hoy = new Date();
    const treintaDias = addDays(hoy, 30);
    const noventaDias = addDays(hoy, 90);

    const [vencidos, proximos30, proximos90] = await Promise.all([
      // Vencidos
      this.prisma.pasaporte.findMany({
        where: {
          activo: true,
          fechaVencimiento: { lt: hoy },
        },
        include: {
          profesor: {
            select: {
              id: true,
              ci: true,
              nombre: true,
              apellidos: true,
              telefonoMovil: true,
              email: true,
            },
          },
        },
        orderBy: { fechaVencimiento: 'desc' },
      }),

      // Próximos a vencer (30 días)
      this.prisma.pasaporte.findMany({
        where: {
          activo: true,
          fechaVencimiento: {
            gte: hoy,
            lte: treintaDias,
          },
        },
        include: {
          profesor: {
            select: {
              id: true,
              ci: true,
              nombre: true,
              apellidos: true,
              telefonoMovil: true,
              email: true,
            },
          },
        },
        orderBy: { fechaVencimiento: 'asc' },
      }),

      // Próximos a vencer (90 días)
      this.prisma.pasaporte.findMany({
        where: {
          activo: true,
          fechaVencimiento: {
            gt: treintaDias,
            lte: noventaDias,
          },
        },
        include: {
          profesor: {
            select: {
              id: true,
              ci: true,
              nombre: true,
              apellidos: true,
              telefonoMovil: true,
              email: true,
            },
          },
        },
        orderBy: { fechaVencimiento: 'asc' },
      }),
    ]);

    return {
      vencidos,
      proximos30,
      proximos90,
      resumen: {
        totalVencidos: vencidos.length,
        totalProximos30: proximos30.length,
        totalProximos90: proximos90.length,
      },
    };
  }

  async exportarExcel(filters: PasaporteFilterDto) {
    const { data: pasaportes } = await this.findAll({ ...filters, page: 1, limit: 10000 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pasaportes');

    // Add headers
    worksheet.columns = [
      { header: 'Número Archivo', key: 'numeroArchivo', width: 15 },
      { header: 'Número Pasaporte', key: 'numero', width: 18 },
      { header: 'Profesor', key: 'profesor', width: 30 },
      { header: 'CI', key: 'ci', width: 15 },
      { header: 'Fecha Expedición', key: 'fechaExpedicion', width: 18 },
      { header: 'Fecha Vencimiento', key: 'fechaVencimiento', width: 18 },
      { header: 'Lugar Expedición', key: 'lugarExpedicion', width: 20 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Cantidad Visas', key: 'cantidadVisas', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 },
    ];

    // Add data
    for (const pasaporte of pasaportes) {
      const hoy = new Date();
      const vencimiento = new Date(pasaporte.fechaVencimiento);
      let estado = 'Vigente';
      if (vencimiento < hoy) {
        estado = 'Vencido';
      } else if (vencimiento < addDays(hoy, 30)) {
        estado = 'Próximo a vencer';
      }

      worksheet.addRow({
        numeroArchivo: pasaporte.numeroArchivo,
        numero: pasaporte.numero,
        profesor: `${pasaporte.profesor?.nombre} ${pasaporte.profesor?.apellidos}`,
        ci: pasaporte.profesor?.ci,
        fechaExpedicion: pasaporte.fechaExpedicion.toLocaleDateString('es-CU'),
        fechaVencimiento: pasaporte.fechaVencimiento.toLocaleDateString('es-CU'),
        lugarExpedicion: pasaporte.lugarExpedicion,
        tipo: pasaporte.tipo || 'N/A',
        cantidadVisas: pasaporte._count?.visas || 0,
        estado,
      });
    }

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}

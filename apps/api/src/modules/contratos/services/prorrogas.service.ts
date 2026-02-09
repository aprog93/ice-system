import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateProrrogaDto, UpdateProrrogaDto, ProrrogaFilterDto } from '../dto/prorroga.dto';
import { isBefore } from 'date-fns';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ProrrogasService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: ProrrogaFilterDto) {
    const { contratoId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (contratoId) {
      where.contratoId = contratoId;
    }

    const [prorrogas, total] = await Promise.all([
      this.prisma.prorroga.findMany({
        where,
        skip,
        take: limit,
        orderBy: { numeroProrroga: 'asc' },
        include: {
          contrato: {
            include: {
              profesor: {
                select: {
                  id: true,
                  ci: true,
                  nombre: true,
                  apellidos: true,
                },
              },
              pais: true,
            },
          },
        },
      }),
      this.prisma.prorroga.count({ where }),
    ]);

    return {
      data: prorrogas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const prorroga = await this.prisma.prorroga.findUnique({
      where: { id },
      include: {
        contrato: {
          include: {
            profesor: {
              select: {
                id: true,
                ci: true,
                nombre: true,
                apellidos: true,
              },
            },
            pais: true,
          },
        },
      },
    });

    if (!prorroga) {
      throw new NotFoundException('Prórroga no encontrada');
    }

    return prorroga;
  }

  async create(createDto: CreateProrrogaDto, userId: string) {
    // Check if contrato exists
    const contrato = await this.prisma.contrato.findUnique({
      where: { id: createDto.contratoId },
    });

    if (!contrato) {
      throw new NotFoundException('Contrato no encontrado');
    }

    // Check if contrato is closed
    if (contrato.estado === 'CERRADO') {
      throw new BadRequestException('No se puede agregar prórrogas a un contrato cerrado');
    }

    if (contrato.estado === 'CANCELADO') {
      throw new BadRequestException('No se puede agregar prórrogas a un contrato cancelado');
    }

    // Validate dates
    if (isBefore(createDto.fechaHasta, createDto.fechaDesde)) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    // Validate that prorroga starts after or at contract end
    if (isBefore(createDto.fechaDesde, contrato.fechaFin)) {
      throw new BadRequestException(
        'La prórroga debe comenzar en o después de la fecha de fin del contrato',
      );
    }

    // Generate prorroga number
    const lastProrroga = await this.prisma.prorroga.findFirst({
      where: { contratoId: createDto.contratoId },
      orderBy: { numeroProrroga: 'desc' },
    });

    const numeroProrroga = (lastProrroga?.numeroProrroga || 0) + 1;

    // Create prorroga
    const prorroga = await this.prisma.prorroga.create({
      data: {
        ...createDto,
        numeroProrroga,
        motivo: createDto.motivo.toUpperCase(),
        createdBy: userId,
      },
      include: {
        contrato: {
          include: {
            profesor: {
              select: {
                id: true,
                ci: true,
                nombre: true,
                apellidos: true,
              },
            },
            pais: true,
          },
        },
      },
    });

    // Update contract status and end date
    await this.prisma.contrato.update({
      where: { id: createDto.contratoId },
      data: {
        estado: 'PRORROGADO',
        fechaFin: createDto.fechaHasta,
      },
    });

    return prorroga;
  }

  async update(id: string, updateDto: UpdateProrrogaDto, userId: string) {
    const prorroga = await this.prisma.prorroga.findUnique({
      where: { id },
      include: { contrato: true },
    });

    if (!prorroga) {
      throw new NotFoundException('Prórroga no encontrada');
    }

    // Check if contrato is closed
    if (prorroga.contrato.estado === 'CERRADO') {
      throw new BadRequestException('No se puede modificar prórrogas de un contrato cerrado');
    }

    // Validate dates
    if (isBefore(updateDto.fechaHasta, updateDto.fechaDesde)) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    return this.prisma.prorroga.update({
      where: { id },
      data: {
        ...updateDto,
        motivo: updateDto.motivo.toUpperCase(),
      },
      include: {
        contrato: {
          include: {
            profesor: {
              select: {
                id: true,
                ci: true,
                nombre: true,
                apellidos: true,
              },
            },
            pais: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const prorroga = await this.prisma.prorroga.findUnique({
      where: { id },
      include: { contrato: true },
    });

    if (!prorroga) {
      throw new NotFoundException('Prórroga no encontrada');
    }

    // Check if contrato is closed
    if (prorroga.contrato.estado === 'CERRADO') {
      throw new BadRequestException('No se puede eliminar prórrogas de un contrato cerrado');
    }

    // Get the last prorroga for this contract
    const lastProrroga = await this.prisma.prorroga.findFirst({
      where: { contratoId: prorroga.contratoId },
      orderBy: { numeroProrroga: 'desc' },
    });

    // Only allow deleting the last prorroga
    if (lastProrroga && lastProrroga.id !== id) {
      throw new BadRequestException('Solo se puede eliminar la última prórroga del contrato');
    }

    await this.prisma.prorroga.delete({
      where: { id },
    });

    // Update contract status and revert end date
    const previousProrroga = await this.prisma.prorroga.findFirst({
      where: { contratoId: prorroga.contratoId },
      orderBy: { numeroProrroga: 'desc' },
    });

    // If there's a previous prorroga, use its fechaHasta
    // Otherwise, revert to one day before the deleted prorroga's fechaDesde
    // (which was the original contract end date)
    let newFechaFin: Date;
    if (previousProrroga) {
      newFechaFin = previousProrroga.fechaHasta;
    } else {
      // Subtract one day from fechaDesde to get original contract end date
      newFechaFin = new Date(prorroga.fechaDesde);
      newFechaFin.setDate(newFechaFin.getDate() - 1);
    }

    await this.prisma.contrato.update({
      where: { id: prorroga.contratoId },
      data: {
        estado: previousProrroga ? 'PRORROGADO' : 'ACTIVO',
        fechaFin: newFechaFin,
      },
    });
  }

  async exportarExcel(filters: ProrrogaFilterDto) {
    const { data: prorrogas } = await this.findAll({ ...filters, page: 1, limit: 10000 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Prorrogas');

    // Add headers
    worksheet.columns = [
      { header: 'Contrato', key: 'contrato', width: 20 },
      { header: 'Prórroga N°', key: 'numeroProrroga', width: 15 },
      { header: 'Profesor', key: 'profesor', width: 30 },
      { header: 'CI', key: 'ci', width: 15 },
      { header: 'País', key: 'pais', width: 20 },
      { header: 'Fecha Desde', key: 'fechaDesde', width: 15 },
      { header: 'Fecha Hasta', key: 'fechaHasta', width: 15 },
      { header: 'Función', key: 'funcion', width: 25 },
      { header: 'Motivo', key: 'motivo', width: 30 },
      { header: 'Salario Contrato', key: 'salario', width: 18 },
    ];

    // Add data
    for (const prorroga of prorrogas) {
      worksheet.addRow({
        contrato: `${prorroga.contrato?.numeroConsecutivo}/${prorroga.contrato?.ano}`,
        numeroProrroga: prorroga.numeroProrroga,
        profesor: `${prorroga.contrato?.profesor?.nombre} ${prorroga.contrato?.profesor?.apellidos}`,
        ci: prorroga.contrato?.profesor?.ci,
        pais: prorroga.contrato?.pais?.nombre,
        fechaDesde: prorroga.fechaDesde.toLocaleDateString('es-CU'),
        fechaHasta: prorroga.fechaHasta.toLocaleDateString('es-CU'),
        funcion: prorroga.contrato?.funcion || 'N/A',
        motivo: prorroga.motivo,
        salario: prorroga.contrato?.salarioMensual
          ? `${prorroga.contrato.salarioMensual} ${prorroga.contrato.moneda}`
          : 'N/A',
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

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateContratoDto, UpdateContratoDto, CerrarContratoDto, ContratoFilterDto } from '../dto/contrato.dto';
import { fechasSeSolapan } from '@/common/utils/string.utils';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ContratosService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: ContratoFilterDto) {
    const { profesorId, paisId, estado, ano, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (profesorId) {
      where.profesorId = profesorId;
    }

    if (paisId) {
      where.paisId = paisId;
    }

    if (estado) {
      where.estado = estado;
    }

    if (ano) {
      where.ano = ano;
    }

    const [contratos, total] = await Promise.all([
      this.prisma.contrato.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
          _count: {
            select: { prorrogas: true },
          },
        },
      }),
      this.prisma.contrato.count({ where }),
    ]);

    return {
      data: contratos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id },
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
        pais: true,
        prorrogas: {
          orderBy: { numeroProrroga: 'asc' },
        },
      },
    });

    if (!contrato) {
      throw new NotFoundException('Contrato no encontrado');
    }

    return contrato;
  }

  async create(createDto: CreateContratoDto, userId: string) {
    // Validate dates
    if (createDto.fechaFin <= createDto.fechaInicio) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio',
      );
    }

    // Check if profesor exists
    const profesor = await this.prisma.profesor.findUnique({
      where: { id: createDto.profesorId },
    });

    if (!profesor) {
      throw new NotFoundException('Profesor no encontrado');
    }

    // Check for overlapping contracts
    const overlappingContracts = await this.prisma.contrato.findMany({
      where: {
        profesorId: createDto.profesorId,
        estado: { in: ['ACTIVO', 'PRORROGADO'] },
      },
    });

    for (const contract of overlappingContracts) {
      if (
        fechasSeSolapan(
          createDto.fechaInicio,
          createDto.fechaFin,
          contract.fechaInicio,
          contract.fechaFin,
        )
      ) {
        throw new ConflictException(
          `El profesor ya tiene un contrato activo que se solapa con las fechas indicadas (Contrato #${contract.numeroConsecutivo}/${contract.ano})`,
        );
      }
    }

    // Generate consecutive number for the year
    const ano = createDto.fechaInicio.getFullYear();
    const lastContract = await this.prisma.contrato.findFirst({
      where: { ano },
      orderBy: { numeroConsecutivo: 'desc' },
    });

    const numeroConsecutivo = (lastContract?.numeroConsecutivo || 0) + 1;

    return this.prisma.contrato.create({
      data: {
        ...createDto,
        ano,
        numeroConsecutivo,
        estado: 'ACTIVO',
        funcion: createDto.funcion.toUpperCase(),
        centroTrabajo: createDto.centroTrabajo.toUpperCase(),
        direccionTrabajo: createDto.direccionTrabajo?.toUpperCase(),
        createdBy: userId,
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
        pais: true,
      },
    });
  }

  async update(id: string, updateDto: UpdateContratoDto, userId: string) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id },
    });

    if (!contrato) {
      throw new NotFoundException('Contrato no encontrado');
    }

    if (contrato.estado === 'CERRADO' || contrato.estado === 'CANCELADO') {
      throw new BadRequestException(
        'No se puede modificar un contrato cerrado o cancelado',
      );
    }

    // Validate dates
    if (updateDto.fechaFin <= updateDto.fechaInicio) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio',
      );
    }

    // Check for overlapping contracts (excluding current contract)
    const overlappingContracts = await this.prisma.contrato.findMany({
      where: {
        profesorId: updateDto.profesorId,
        estado: { in: ['ACTIVO', 'PRORROGADO'] },
        id: { not: id },
      },
    });

    for (const contract of overlappingContracts) {
      if (
        fechasSeSolapan(
          updateDto.fechaInicio,
          updateDto.fechaFin,
          contract.fechaInicio,
          contract.fechaFin,
        )
      ) {
        throw new ConflictException(
          `El profesor ya tiene un contrato activo que se solapa con las fechas indicadas (Contrato #${contract.numeroConsecutivo}/${contract.ano})`,
        );
      }
    }

    return this.prisma.contrato.update({
      where: { id },
      data: {
        ...updateDto,
        funcion: updateDto.funcion.toUpperCase(),
        centroTrabajo: updateDto.centroTrabajo.toUpperCase(),
        direccionTrabajo: updateDto.direccionTrabajo?.toUpperCase(),
        updatedBy: userId,
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
        pais: true,
      },
    });
  }

  async remove(id: string) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id },
      include: { prorrogas: true },
    });

    if (!contrato) {
      throw new NotFoundException('Contrato no encontrado');
    }

    if (contrato.prorrogas.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar un contrato que tiene prórrogas',
      );
    }

    await this.prisma.contrato.delete({
      where: { id },
    });
  }

  async cerrar(id: string, cerrarDto: CerrarContratoDto, userId: string) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id },
    });

    if (!contrato) {
      throw new NotFoundException('Contrato no encontrado');
    }

    if (contrato.estado === 'CERRADO') {
      throw new BadRequestException('El contrato ya está cerrado');
    }

    if (contrato.estado === 'CANCELADO') {
      throw new BadRequestException('No se puede cerrar un contrato cancelado');
    }

    return this.prisma.contrato.update({
      where: { id },
      data: {
        estado: 'CERRADO',
        fechaCierre: cerrarDto.fechaCierre,
        motivoCierre: cerrarDto.motivoCierre.toUpperCase(),
        updatedBy: userId,
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
        pais: true,
      },
    });
  }

  async exportarExcel(filters: ContratoFilterDto) {
    const { data: contratos } = await this.findAll({ ...filters, page: 1, limit: 10000 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contratos');

    // Add headers
    worksheet.columns = [
      { header: 'Número', key: 'numero', width: 15 },
      { header: 'Profesor', key: 'profesor', width: 30 },
      { header: 'CI', key: 'ci', width: 15 },
      { header: 'País', key: 'pais', width: 20 },
      { header: 'Fecha Inicio', key: 'fechaInicio', width: 15 },
      { header: 'Fecha Fin', key: 'fechaFin', width: 15 },
      { header: 'Función', key: 'funcion', width: 25 },
      { header: 'Centro de Trabajo', key: 'centroTrabajo', width: 25 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Salario', key: 'salario', width: 15 },
    ];

    // Add data
    for (const contrato of contratos) {
      worksheet.addRow({
        numero: `${contrato.numeroConsecutivo}/${contrato.ano}`,
        profesor: `${contrato.profesor?.nombre} ${contrato.profesor?.apellidos}`,
        ci: contrato.profesor?.ci,
        pais: contrato.pais?.nombre,
        fechaInicio: contrato.fechaInicio.toLocaleDateString('es-CU'),
        fechaFin: contrato.fechaFin.toLocaleDateString('es-CU'),
        funcion: contrato.funcion,
        centroTrabajo: contrato.centroTrabajo,
        estado: contrato.estado,
        salario: contrato.salarioMensual 
          ? `${contrato.salarioMensual} ${contrato.moneda}` 
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

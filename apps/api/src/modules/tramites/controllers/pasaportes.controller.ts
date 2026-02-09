import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PasaportesService } from '../services/pasaportes.service';
import { PdfService } from '../services/pdf.service';
import {
  CreatePasaporteDto,
  UpdatePasaporteDto,
  PasaporteFilterDto,
  GenerarSolicitudDto,
} from '../dto/pasaporte.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Trámites - Pasaportes')
@Controller('pasaportes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PasaportesController {
  constructor(
    private readonly pasaportesService: PasaportesService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar pasaportes con filtros' })
  @ApiResponse({ status: 200, description: 'Lista de pasaportes' })
  async findAll(@Query() filters: PasaporteFilterDto) {
    return this.pasaportesService.findAll(filters);
  }

  @Get('alertas/vencimientos')
  @ApiOperation({ summary: 'Obtener alertas de vencimientos' })
  @ApiResponse({ status: 200, description: 'Lista de pasaportes próximos a vencer o vencidos' })
  async getAlertasVencimientos() {
    return this.pasaportesService.getAlertasVencimientos();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un pasaporte por ID' })
  @ApiResponse({ status: 200, description: 'Pasaporte encontrado' })
  @ApiResponse({ status: 404, description: 'Pasaporte no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pasaportesService.findOne(id);
  }

  @Post()
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @ApiOperation({ summary: 'Crear un nuevo pasaporte' })
  @ApiResponse({ status: 201, description: 'Pasaporte creado' })
  async create(@Body() createDto: CreatePasaporteDto, @CurrentUser('userId') userId: string) {
    return this.pasaportesService.create(createDto, userId);
  }

  @Put(':id')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @ApiOperation({ summary: 'Actualizar un pasaporte' })
  @ApiResponse({ status: 200, description: 'Pasaporte actualizado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePasaporteDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.pasaportesService.update(id, updateDto, userId);
  }

  @Delete(':id')
  @Roles(Rol.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un pasaporte' })
  @ApiResponse({ status: 204, description: 'Pasaporte eliminado' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.pasaportesService.remove(id);
  }

  @Post('generar-solicitud')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @ApiOperation({ summary: 'Generar PDF de solicitud de pasaporte' })
  @ApiResponse({ status: 200, description: 'PDF generado' })
  async generarSolicitud(@Body() generarDto: GenerarSolicitudDto, @Res() res: Response) {
    const pdfBuffer = await this.pdfService.generarSolicitudPasaporte(generarDto);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="solicitud-pasaporte-${generarDto.pasaporteId}.pdf"`,
      'Content-Length': (pdfBuffer as unknown as Buffer).length,
    });

    res.send(pdfBuffer);
  }

  @Get('exportar/excel')
  @Roles(Rol.ADMIN, Rol.OPERADOR, Rol.CONSULTA)
  @ApiOperation({ summary: 'Exportar pasaportes a Excel' })
  @ApiResponse({ status: 200, description: 'Archivo Excel generado' })
  async exportarExcel(@Query() filters: PasaporteFilterDto, @Res() res: Response) {
    const buffer = await this.pasaportesService.exportarExcel(filters);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="pasaportes-${Date.now()}.xlsx"`,
      'Content-Length': (buffer as unknown as Buffer).length,
    });

    res.end(buffer);
  }

  @Get('reporte/pdf')
  @Roles(Rol.ADMIN, Rol.OPERADOR, Rol.CONSULTA)
  @ApiOperation({ summary: 'Generar reporte de pasaportes en PDF' })
  @ApiResponse({ status: 200, description: 'PDF generado' })
  async generarReportePdf(@Query() filters: PasaporteFilterDto, @Res() res: Response) {
    const { data: pasaportes } = await this.pasaportesService.findAll({
      ...filters,
      page: 1,
      limit: 10000,
    });
    const pdfBuffer = await this.pdfService.generarReportePasaportes(pasaportes);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-pasaportes-${Date.now()}.pdf"`,
      'Content-Length': (pdfBuffer as unknown as Buffer).length,
    });

    res.end(pdfBuffer);
  }

  @Post(':id/formulario-x22')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @ApiOperation({ summary: 'Generar formulario X-22 A ICE de solicitud de pasaporte' })
  @ApiResponse({ status: 200, description: 'PDF generado' })
  async generarFormularioX22(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const pdfBuffer = await this.pdfService.generarFormularioSolicitudPasaporteX22(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="solicitud-pasaporte-X22-${id}.pdf"`,
      'Content-Length': (pdfBuffer as unknown as Buffer).length,
    });

    res.send(pdfBuffer);
  }

  @Post(':id/acta-extranjeria')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @ApiOperation({ summary: 'Generar Acta de Extranjería' })
  @ApiResponse({ status: 200, description: 'PDF generado' })
  async generarActaExtranjeria(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const pdfBuffer = await this.pdfService.generarActaExtranjeriaPasaporte(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="acta-extranjeria-${id}.pdf"`,
      'Content-Length': (pdfBuffer as unknown as Buffer).length,
    });

    res.send(pdfBuffer);
  }
}

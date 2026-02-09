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
import { ContratosService } from '../services/contratos.service';
import { PdfService } from '@/modules/tramites/services/pdf.service';
import {
  CreateContratoDto,
  UpdateContratoDto,
  CerrarContratoDto,
  ContratoFilterDto,
} from '../dto/contrato.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Contratos')
@Controller('contratos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ContratosController {
  constructor(
    private readonly contratosService: ContratosService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar contratos con filtros' })
  @ApiResponse({ status: 200, description: 'Lista de contratos' })
  async findAll(@Query() filters: ContratoFilterDto) {
    return this.contratosService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un contrato por ID' })
  @ApiResponse({ status: 200, description: 'Contrato encontrado' })
  @ApiResponse({ status: 404, description: 'Contrato no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contratosService.findOne(id);
  }

  @Post()
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @ApiOperation({ summary: 'Crear un nuevo contrato' })
  @ApiResponse({ status: 201, description: 'Contrato creado' })
  async create(@Body() createDto: CreateContratoDto, @CurrentUser('userId') userId: string) {
    return this.contratosService.create(createDto, userId);
  }

  @Put(':id')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @ApiOperation({ summary: 'Actualizar un contrato' })
  @ApiResponse({ status: 200, description: 'Contrato actualizado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateContratoDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.contratosService.update(id, updateDto, userId);
  }

  @Delete(':id')
  @Roles(Rol.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un contrato' })
  @ApiResponse({ status: 204, description: 'Contrato eliminado' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.contratosService.remove(id);
  }

  @Post(':id/cerrar')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @ApiOperation({ summary: 'Cerrar un contrato' })
  @ApiResponse({ status: 200, description: 'Contrato cerrado' })
  async cerrar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cerrarDto: CerrarContratoDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.contratosService.cerrar(id, cerrarDto, userId);
  }

  @Get('exportar/excel')
  @Roles(Rol.ADMIN, Rol.OPERADOR, Rol.CONSULTA)
  @ApiOperation({ summary: 'Exportar contratos a Excel' })
  @ApiResponse({ status: 200, description: 'Archivo Excel generado' })
  async exportarExcel(@Query() filters: ContratoFilterDto, @Res() res: Response) {
    const buffer = await this.contratosService.exportarExcel(filters);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="contratos-${Date.now()}.xlsx"`,
      'Content-Length': (buffer as unknown as Buffer).length,
    });

    res.send(buffer);
  }

  @Get('reporte/pdf')
  @Roles(Rol.ADMIN, Rol.OPERADOR, Rol.CONSULTA)
  @ApiOperation({ summary: 'Generar reporte de contratos en PDF' })
  @ApiResponse({ status: 200, description: 'PDF generado' })
  async generarReportePdf(@Query() filters: ContratoFilterDto, @Res() res: Response) {
    const { data: contratos } = await this.contratosService.findAll({
      ...filters,
      page: 1,
      limit: 10000,
    });
    const pdfBuffer = await this.pdfService.generarReporteContratos(contratos);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-contratos-${Date.now()}.pdf"`,
      'Content-Length': (pdfBuffer as unknown as Buffer).length,
    });

    res.end(pdfBuffer);
  }

  @Post(':id/generar-acta-extranjeria')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @ApiOperation({ summary: 'Generar PDF de acta de extranjería' })
  @ApiResponse({ status: 200, description: 'PDF generado' })
  async generarActaExtranjeria(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const pdfBuffer = await this.pdfService.generarActaExtranjeria(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="acta-extranjeria-${id}.pdf"`,
      'Content-Length': (pdfBuffer as unknown as Buffer).length,
    });

    res.send(pdfBuffer);
  }

  @Post(':id/generar-cierre')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @ApiOperation({ summary: 'Generar PDF de cierre de contrato' })
  @ApiResponse({ status: 200, description: 'PDF generado' })
  async generarCierre(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const pdfBuffer = await this.pdfService.generarCierreContrato(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cierre-contrato-${id}.pdf"`,
      'Content-Length': (pdfBuffer as unknown as Buffer).length,
    });

    res.send(pdfBuffer);
  }
}

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
import { ProrrogasService } from '../services/prorrogas.service';
import { PdfService } from '@/modules/tramites/services/pdf.service';
import { CreateProrrogaDto, UpdateProrrogaDto, ProrrogaFilterDto } from '../dto/prorroga.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ContratosService } from '../services/contratos.service';

@ApiTags('Prórrogas')
@Controller('prorrogas')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProrrogasController {
  constructor(
    private readonly prorrogasService: ProrrogasService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar prórrogas con filtros' })
  @ApiResponse({ status: 200, description: 'Lista de prórrogas' })
  async findAll(@Query() filters: ProrrogaFilterDto) {
    return this.prorrogasService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una prórroga por ID' })
  @ApiResponse({ status: 200, description: 'Prórroga encontrada' })
  @ApiResponse({ status: 404, description: 'Prórroga no encontrada' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.prorrogasService.findOne(id);
  }

  @Post()
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @ApiOperation({ summary: 'Crear una nueva prórroga' })
  @ApiResponse({ status: 201, description: 'Prórroga creada' })
  async create(@Body() createDto: CreateProrrogaDto, @CurrentUser('userId') userId: string) {
    return this.prorrogasService.create(createDto, userId);
  }

  @Put(':id')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @ApiOperation({ summary: 'Actualizar una prórroga' })
  @ApiResponse({ status: 200, description: 'Prórroga actualizada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateProrrogaDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.prorrogasService.update(id, updateDto, userId);
  }

  @Delete(':id')
  @Roles(Rol.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una prórroga' })
  @ApiResponse({ status: 204, description: 'Prórroga eliminada' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.prorrogasService.remove(id);
  }

  @Post(':id/generar-suplemento')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generar PDF de suplemento de prórroga' })
  @ApiResponse({ status: 200, description: 'PDF generado' })
  async generarSuplemento(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const pdfBuffer = await this.pdfService.generarSuplementoProrroga(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="suplemento-prorroga-${id}.pdf"`,
      'Content-Length': (pdfBuffer as unknown as Buffer).length,
    });

    res.send(pdfBuffer);
  }

  @Get('exportar/excel')
  @Roles(Rol.ADMIN, Rol.OPERADOR, Rol.CONSULTA)
  @ApiOperation({ summary: 'Exportar prórrogas a Excel' })
  @ApiResponse({ status: 200, description: 'Archivo Excel generado' })
  async exportarExcel(@Query() filters: ProrrogaFilterDto, @Res() res: Response) {
    const buffer = await this.prorrogasService.exportarExcel(filters);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="prorrogas-${Date.now()}.xlsx"`,
      'Content-Length': (buffer as unknown as Buffer).length,
    });

    res.end(buffer);
  }

  @Get('reporte/pdf')
  @Roles(Rol.ADMIN, Rol.OPERADOR, Rol.CONSULTA)
  @ApiOperation({ summary: 'Generar reporte de prórrogas en PDF' })
  @ApiResponse({ status: 200, description: 'PDF generado' })
  async generarReportePdf(@Query() filters: ProrrogaFilterDto, @Res() res: Response) {
    const { data: prorrogas } = await this.prorrogasService.findAll({
      ...filters,
      page: 1,
      limit: 10000,
    });
    const pdfBuffer = await this.pdfService.generarReporteProrrogas(prorrogas);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-prorrogas-${Date.now()}.pdf"`,
      'Content-Length': (pdfBuffer as unknown as Buffer).length,
    });

    res.end(pdfBuffer);
  }
}

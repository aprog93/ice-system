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
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ProfesoresService } from '../services/profesores.service';
import { CsvImportService } from '../services/csv-import.service';
import { PotencialImportService } from '../services/potencial-import.service';
import { PdfService } from '@/modules/tramites/services/pdf.service';
import { CreateProfesorDto, UpdateProfesorDto, ProfesorFilterDto } from '../dto/profesor.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Profesores - Potencial')
@Controller('profesores')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProfesoresController {
  constructor(
    private readonly profesoresService: ProfesoresService,
    private readonly csvImportService: CsvImportService,
    private readonly potencialImportService: PotencialImportService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar profesores con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista de profesores' })
  async findAll(@Query() filters: ProfesorFilterDto) {
    return this.profesoresService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un profesor por ID' })
  @ApiResponse({ status: 200, description: 'Profesor encontrado' })
  @ApiResponse({ status: 404, description: 'Profesor no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.profesoresService.findOne(id);
  }

  @Post()
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @ApiOperation({ summary: 'Crear un nuevo profesor' })
  @ApiResponse({ status: 201, description: 'Profesor creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(@Body() createDto: CreateProfesorDto, @CurrentUser('userId') userId: string) {
    return this.profesoresService.create(createDto, userId);
  }

  @Put(':id')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @ApiOperation({ summary: 'Actualizar un profesor' })
  @ApiResponse({ status: 200, description: 'Profesor actualizado' })
  @ApiResponse({ status: 404, description: 'Profesor no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateProfesorDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.profesoresService.update(id, updateDto, userId);
  }

  @Delete(':id')
  @Roles(Rol.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un profesor' })
  @ApiResponse({ status: 204, description: 'Profesor eliminado' })
  @ApiResponse({ status: 404, description: 'Profesor no encontrado' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('nombre') nombre: string,
    @CurrentUser('apellidos') apellidos: string,
  ) {
    const userName = `${nombre} ${apellidos}`;
    await this.profesoresService.remove(id, userId, userName);
  }

  @Post('importar-excel')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @UseInterceptors(FileInterceptor('archivo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importar profesores desde Excel' })
  @ApiResponse({ status: 200, description: 'Importación completada' })
  async importarExcel(
    @UploadedFile() archivo: Express.Multer.File,
    @CurrentUser('userId') userId: string,
  ) {
    return this.profesoresService.importarExcel(archivo, userId);
  }

  @Post('importar-csv')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @UseInterceptors(FileInterceptor('archivo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importar datos desde CSV (Base Colaboración 2024)' })
  @ApiResponse({ status: 200, description: 'Importación CSV completada' })
  async importarCsv(
    @UploadedFile() archivo: Express.Multer.File,
    @CurrentUser('userId') userId: string,
  ) {
    return this.csvImportService.importarCsv(archivo.buffer, userId);
  }

  @Post('importar-potencial')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @UseInterceptors(FileInterceptor('archivo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importar desde formato Potencial por Acciones' })
  @ApiResponse({ status: 200, description: 'Importación de potencial completada' })
  async importarPotencial(
    @UploadedFile() archivo: Express.Multer.File,
    @CurrentUser('userId') userId: string,
  ) {
    return this.potencialImportService.importarPotencialExcel(archivo, userId);
  }

  @Get('exportar/excel')
  @Roles(Rol.ADMIN, Rol.OPERADOR, Rol.CONSULTA)
  @ApiOperation({ summary: 'Exportar profesores a Excel' })
  @ApiResponse({ status: 200, description: 'Archivo Excel generado' })
  async exportarExcel(@Query() filters: ProfesorFilterDto, @Res() res: Response) {
    const buffer = await this.profesoresService.exportarExcel(filters);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="profesores-${Date.now()}.xlsx"`,
      'Content-Length': (buffer as unknown as Buffer).length,
    });

    res.send(buffer);
  }

  @Post(':id/generar-ficha')
  @Roles(Rol.ADMIN, Rol.OPERADOR, Rol.CONSULTA)
  @ApiOperation({ summary: 'Generar PDF de ficha del profesor' })
  @ApiResponse({ status: 200, description: 'PDF generado' })
  async generarFicha(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const pdfBuffer = await this.pdfService.generarFichaProfesor(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ficha-profesor-${id}.pdf"`,
      'Content-Length': (pdfBuffer as unknown as Buffer).length,
    });

    res.send(pdfBuffer);
  }

  @Get('reporte/pdf')
  @Roles(Rol.ADMIN, Rol.OPERADOR, Rol.CONSULTA)
  @ApiOperation({ summary: 'Generar reporte de profesores en PDF' })
  @ApiResponse({ status: 200, description: 'PDF generado' })
  async generarReportePdf(@Query() filters: ProfesorFilterDto, @Res() res: Response) {
    const { data: profesores } = await this.profesoresService.findAll({
      ...filters,
      page: 1,
      limit: 10000,
    });
    const pdfBuffer = await this.pdfService.generarReporteProfesores(profesores);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-profesores-${Date.now()}.pdf"`,
      'Content-Length': (pdfBuffer as unknown as Buffer).length,
    });

    res.end(pdfBuffer);
  }
}

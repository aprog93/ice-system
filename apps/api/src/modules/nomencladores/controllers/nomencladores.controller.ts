import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NomencladoresService } from '../services/nomencladores.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Nomencladores')
@Controller('nomencladores')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NomencladoresController {
  constructor(private readonly nomencladoresService: NomencladoresService) {}

  @Get('provincias')
  @ApiOperation({ summary: 'Obtener todas las provincias' })
  @ApiResponse({ status: 200, description: 'Lista de provincias' })
  async getProvincias() {
    return this.nomencladoresService.getProvincias();
  }

  @Get('municipios')
  @ApiOperation({ summary: 'Obtener todos los municipios o filtrar por provincia' })
  @ApiResponse({ status: 200, description: 'Lista de municipios' })
  async getMunicipios(@Query('provinciaId') provinciaId?: string) {
    console.log('📍 GET /municipios - provinciaId:', provinciaId);
    if (provinciaId) {
      const result = await this.nomencladoresService.getMunicipiosByProvincia(provinciaId);
      console.log('📍 Municipios encontrados:', result.length);
      return result;
    }
    return this.nomencladoresService.getMunicipios();
  }

  @Get('paises')
  @ApiOperation({ summary: 'Obtener todos los países' })
  @ApiResponse({ status: 200, description: 'Lista de países' })
  async getPaises() {
    return this.nomencladoresService.getPaises();
  }

  @Get('cargos')
  @ApiOperation({ summary: 'Obtener todos los cargos' })
  @ApiResponse({ status: 200, description: 'Lista de cargos' })
  async getCargos() {
    return this.nomencladoresService.getCargos();
  }

  @Get('especialidades')
  @ApiOperation({ summary: 'Obtener todas las especialidades' })
  @ApiResponse({ status: 200, description: 'Lista de especialidades' })
  async getEspecialidades() {
    return this.nomencladoresService.getEspecialidades();
  }

  @Get('categorias-docentes')
  @ApiOperation({ summary: 'Obtener todas las categorías docentes' })
  @ApiResponse({ status: 200, description: 'Lista de categorías docentes' })
  async getCategoriasDocentes() {
    return this.nomencladoresService.getCategoriasDocentes();
  }
}

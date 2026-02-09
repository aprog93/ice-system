import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PapeleraService } from './papelera.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Rol, TipoRegistroPapelera } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Papelera de Reciclaje')
@Controller('papelera')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PapeleraController {
  constructor(private readonly papeleraService: PapeleraService) {}

  @Get()
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @ApiOperation({ summary: 'Listar registros en la papelera' })
  @ApiResponse({ status: 200, description: 'Lista de registros en papelera' })
  async findAll(
    @Query('tipo') tipo?: TipoRegistroPapelera,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.papeleraService.findAll({
      tipo,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Get(':id')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @ApiOperation({ summary: 'Obtener detalle de un registro en papelera' })
  @ApiResponse({ status: 200, description: 'Registro encontrado' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.papeleraService.findOne(id);
  }

  @Post(':id/restaurar')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @ApiOperation({ summary: 'Restaurar un registro desde la papelera' })
  @ApiResponse({ status: 200, description: 'Registro restaurado correctamente' })
  @ApiResponse({ status: 400, description: 'Error al restaurar el registro' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  async restaurar(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('userId') userId: string) {
    return this.papeleraService.restaurar(id, userId);
  }

  @Delete(':id')
  @Roles(Rol.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar permanentemente un registro de la papelera' })
  @ApiResponse({ status: 204, description: 'Registro eliminado permanentemente' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  async eliminarPermanente(@Param('id', ParseUUIDPipe) id: string) {
    await this.papeleraService.eliminarPermanente(id);
  }

  @Post('vaciar')
  @Roles(Rol.ADMIN)
  @ApiOperation({ summary: 'Vaciar papelera (eliminar registros ya restaurados)' })
  @ApiResponse({ status: 200, description: 'Papelera vaciada correctamente' })
  async vaciarPapelera() {
    return this.papeleraService.vaciarPapelera();
  }
}

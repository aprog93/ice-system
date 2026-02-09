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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VisasService } from '../services/visas.service';
import { CreateVisaDto, UpdateVisaDto, VisaFilterDto } from '../dto/visa.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Trámites - Visas')
@Controller('visas')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VisasController {
  constructor(private readonly visasService: VisasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar visas con filtros' })
  @ApiResponse({ status: 200, description: 'Lista de visas' })
  async findAll(@Query() filters: VisaFilterDto) {
    return this.visasService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una visa por ID' })
  @ApiResponse({ status: 200, description: 'Visa encontrada' })
  @ApiResponse({ status: 404, description: 'Visa no encontrada' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.visasService.findOne(id);
  }

  @Post()
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @ApiOperation({ summary: 'Crear una nueva visa' })
  @ApiResponse({ status: 201, description: 'Visa creada' })
  async create(
    @Body() createDto: CreateVisaDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.visasService.create(createDto, userId);
  }

  @Put(':id')
  @Roles(Rol.ADMIN, Rol.OPERADOR)
  @ApiOperation({ summary: 'Actualizar una visa' })
  @ApiResponse({ status: 200, description: 'Visa actualizada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateVisaDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.visasService.update(id, updateDto, userId);
  }

  @Delete(':id')
  @Roles(Rol.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una visa' })
  @ApiResponse({ status: 204, description: 'Visa eliminada' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.visasService.remove(id);
  }
}

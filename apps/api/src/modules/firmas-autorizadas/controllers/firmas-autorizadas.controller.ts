import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { FirmasAutorizadasService } from '../services/firmas-autorizadas.service';
import {
  CreateFirmaAutorizadaDto,
  UpdateFirmaAutorizadaDto,
  FirmaAutorizadaFilterDto,
} from '../dto/firma-autorizada.dto';

@ApiTags('Firmas Autorizadas')
@Controller('firmas-autorizadas')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FirmasAutorizadasController {
  constructor(private readonly firmasService: FirmasAutorizadasService) {}

  @Get()
  @Roles('ADMIN', 'OPERADOR', 'CONSULTA')
  @ApiOperation({ summary: 'Obtener todas las firmas autorizadas' })
  findAll(@Query() filters?: FirmaAutorizadaFilterDto) {
    return this.firmasService.findAll(filters);
  }

  @Get('activas')
  @Roles('ADMIN', 'OPERADOR', 'CONSULTA')
  @ApiOperation({ summary: 'Obtener firmas autorizadas activas' })
  findAllActivas() {
    return this.firmasService.findAllActivas();
  }

  @Get('para-documento')
  @Roles('ADMIN', 'OPERADOR')
  @ApiOperation({ summary: 'Obtener las 2 firmas para documentos' })
  getFirmasParaDocumento() {
    return this.firmasService.getFirmasParaDocumento();
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERADOR', 'CONSULTA')
  @ApiOperation({ summary: 'Obtener una firma por ID' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.firmasService.findById(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear nueva firma autorizada' })
  create(@Body() data: CreateFirmaAutorizadaDto) {
    return this.firmasService.create(data);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar firma autorizada' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() data: UpdateFirmaAutorizadaDto) {
    return this.firmasService.update(id, data);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar firma autorizada' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.firmasService.remove(id);
  }
}

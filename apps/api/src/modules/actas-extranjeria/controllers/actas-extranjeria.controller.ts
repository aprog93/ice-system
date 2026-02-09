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
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ActasExtranjeriaService } from '../services/actas-extranjeria.service';
import { PdfService } from '../../tramites/services/pdf.service';
import {
  CreateActaExtranjeriaDto,
  UpdateActaExtranjeriaDto,
  ActaExtranjeriaFilterDto,
} from '../dto/acta-extranjeria.dto';

@ApiTags('Actas de Extranjería')
@Controller('actas-extranjeria')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ActasExtranjeriaController {
  constructor(
    private readonly actasService: ActasExtranjeriaService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  @Roles('ADMIN', 'OPERADOR', 'CONSULTA')
  @ApiOperation({ summary: 'Obtener todas las actas de extranjería' })
  findAll(@Query() filters?: ActaExtranjeriaFilterDto) {
    return this.actasService.findAll(filters);
  }

  @Get('proximo-numero')
  @Roles('ADMIN', 'OPERADOR')
  @ApiOperation({ summary: 'Obtener el próximo número de acta para un año' })
  async getNextNumeroActa(@Query('ano') ano: number) {
    const year = ano || new Date().getFullYear();
    const nextNumero = await this.actasService.getNextNumeroActa(year);
    return { numeroActa: nextNumero, ano: year };
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERADOR', 'CONSULTA')
  @ApiOperation({ summary: 'Obtener un acta por ID' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.actasService.findById(id);
  }

  @Post()
  @Roles('ADMIN', 'OPERADOR')
  @ApiOperation({ summary: 'Crear nueva acta de extranjería' })
  create(@Body() data: CreateActaExtranjeriaDto, @CurrentUser() user: any) {
    return this.actasService.create(data, user.userId);
  }

  @Put(':id')
  @Roles('ADMIN', 'OPERADOR')
  @ApiOperation({ summary: 'Actualizar acta de extranjería' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateActaExtranjeriaDto,
    @CurrentUser() user: any,
  ) {
    return this.actasService.update(id, data, user.userId);
  }

  @Get(':id/pdf')
  @Roles('ADMIN', 'OPERADOR', 'CONSULTA')
  @ApiOperation({ summary: 'Descargar PDF del acta de extranjería' })
  async downloadPDF(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const pdfBuffer = await this.pdfService.generarActaExtranjeriaPdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="acta-extranjeria-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar acta de extranjería' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.actasService.remove(id);
  }
}

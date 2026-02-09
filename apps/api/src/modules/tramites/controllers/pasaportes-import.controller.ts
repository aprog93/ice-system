import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PasaportesImportService } from '../services/pasaportes-import.service';

@ApiTags('Importación de Pasaportes')
@Controller('pasaportes-import')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PasaportesImportController {
  constructor(private readonly importService: PasaportesImportService) {}

  @Post('csv')
  @Roles('ADMIN', 'OPERADOR')
  @ApiOperation({ summary: 'Importar pasaportes desde archivo CSV' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('archivo', {
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(csv|txt)$/)) {
          return callback(new BadRequestException('Solo se permiten archivos CSV'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
    }),
  )
  async importarCsv(@UploadedFile() archivo: Express.Multer.File, @CurrentUser() user: any) {
    if (!archivo) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    const resultado = await this.importService.importarDesdeCsv(
      archivo.buffer,
      archivo.originalname,
      user.userId,
    );

    return {
      message: 'Importación completada',
      historialId: resultado.historialId,
      resumen: {
        total:
          resultado.resumen.exitosos + resultado.resumen.errores + resultado.resumen.totalSaltados,
        exitosos: resultado.resumen.exitosos,
        errores: resultado.resumen.errores,
        saltados: {
          total: resultado.resumen.totalSaltados,
          existentes: resultado.resumen.saltadosExistentes,
          sinProfesor: resultado.resumen.saltadosSinProfesor,
        },
      },
      detalles: resultado.resumen.detalles,
    };
  }

  @Get('historial')
  @Roles('ADMIN', 'OPERADOR')
  @ApiOperation({ summary: 'Obtener historial de importaciones del usuario' })
  async obtenerHistorial(@CurrentUser() user: any) {
    return this.importService.obtenerHistorial(user.userId);
  }

  @Get('historial/:id')
  @Roles('ADMIN', 'OPERADOR')
  @ApiOperation({ summary: 'Obtener detalle de una importación específica' })
  async obtenerDetalleHistorial(@Param('id') id: string, @CurrentUser() user: any) {
    return this.importService.obtenerDetalleHistorial(id, user.userId);
  }

  @Post('excel')
  @Roles('ADMIN', 'OPERADOR')
  @ApiOperation({ summary: 'Importar pasaportes desde archivo Excel (.xlsx)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('archivo', {
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(xlsx|xls)$/)) {
          return callback(
            new BadRequestException('Solo se permiten archivos Excel (.xlsx, .xls)'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max para Excel
      },
    }),
  )
  async importarExcel(@UploadedFile() archivo: Express.Multer.File, @CurrentUser() user: any) {
    if (!archivo) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    const resultado = await this.importService.importarDesdeExcel(
      archivo.buffer,
      archivo.originalname,
      user.userId,
    );

    return {
      message: 'Importación Excel completada',
      historialId: resultado.historialId,
      resumen: {
        total:
          resultado.resumen.exitosos + resultado.resumen.errores + resultado.resumen.totalSaltados,
        exitosos: resultado.resumen.exitosos,
        errores: resultado.resumen.errores,
        saltados: {
          total: resultado.resumen.totalSaltados,
          existentes: resultado.resumen.saltadosExistentes,
          sinProfesor: resultado.resumen.saltadosSinProfesor,
        },
      },
      detalles: resultado.resumen.detalles,
    };
  }
}

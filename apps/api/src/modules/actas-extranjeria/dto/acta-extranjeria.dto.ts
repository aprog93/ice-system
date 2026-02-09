import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActaExtranjeriaDto {
  @ApiProperty({ example: '001', description: 'Número del acta' })
  @IsString()
  @IsNotEmpty({ message: 'El número de acta es requerido' })
  numeroActa: string;

  @ApiProperty({ example: 2024, description: 'Año del acta' })
  @IsNumber()
  @IsNotEmpty({ message: 'El año es requerido' })
  ano: number;

  @ApiProperty({ description: 'ID del profesor' })
  @IsUUID()
  @IsNotEmpty({ message: 'El profesor es requerido' })
  profesorId: string;

  @ApiProperty({ example: '2024-01-15', description: 'Fecha del acta' })
  @IsDateString()
  @IsNotEmpty({ message: 'La fecha del acta es requerida' })
  fechaActa: string;

  @ApiProperty({ example: 'PROFESOR DE MATEMATICAS', description: 'Función que desempeñará' })
  @IsString()
  @IsNotEmpty({ message: 'La función es requerida' })
  funcion: string;

  @ApiProperty({ description: 'ID del país de destino' })
  @IsUUID()
  @IsNotEmpty({ message: 'El país de destino es requerido' })
  paisDestinoId: string;

  @ApiPropertyOptional({ description: 'Observaciones adicionales' })
  @IsString()
  @IsOptional()
  observaciones?: string;
}

export class UpdateActaExtranjeriaDto extends CreateActaExtranjeriaDto {}

export class ActaExtranjeriaFilterDto {
  @ApiPropertyOptional({ description: 'Buscar por número de acta' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por profesor' })
  @IsUUID()
  @IsOptional()
  profesorId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por año' })
  @IsNumber()
  @IsOptional()
  ano?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsNumber()
  @IsOptional()
  limit?: number;
}

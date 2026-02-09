import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVisaDto {
  @ApiProperty({ description: 'ID del pasaporte' })
  @IsUUID()
  @IsNotEmpty({ message: 'El pasaporte es requerido' })
  pasaporteId: string;

  @ApiProperty({ example: 'Turista', description: 'Tipo de visa' })
  @IsString()
  @IsNotEmpty({ message: 'El tipo de visa es requerido' })
  tipo: string;

  @ApiPropertyOptional({ example: 'V12345', description: 'Número de visa' })
  @IsString()
  @IsOptional()
  numero?: string;

  @ApiProperty({ example: '2023-06-01', description: 'Fecha de emisión' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty({ message: 'La fecha de emisión es requerida' })
  fechaEmision: Date;

  @ApiProperty({ example: '2023-12-01', description: 'Fecha de vencimiento' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty({ message: 'La fecha de vencimiento es requerida' })
  fechaVencimiento: Date;

  @ApiProperty({ example: 'ESPAÑA', description: 'País que emitió la visa' })
  @IsString()
  @IsNotEmpty({ message: 'El país de emisión es requerido' })
  paisEmision: string;

  @ApiPropertyOptional({ example: 1, description: 'Número de entradas permitidas' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  numeroEntradas?: number;

  @ApiPropertyOptional({ example: 90, description: 'Duración en días' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  duracionDias?: number;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsString()
  @IsOptional()
  observaciones?: string;
}

export class UpdateVisaDto extends CreateVisaDto {}

export class VisaFilterDto {
  @ApiPropertyOptional({ description: 'ID del pasaporte' })
  @IsUUID()
  @IsOptional()
  pasaporteId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado', example: 'activas' })
  @IsString()
  @IsOptional()
  estado?: 'activas' | 'vencidas' | 'proximas';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  limit?: number;
}

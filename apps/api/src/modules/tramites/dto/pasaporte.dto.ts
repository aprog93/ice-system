import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsOptional,
  IsUUID,
  IsEnum,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoPasaporte } from '@prisma/client';

export class CreatePasaporteDto {
  @ApiProperty({ description: 'ID del profesor' })
  @IsUUID()
  @IsNotEmpty({ message: 'El profesor es requerido' })
  profesorId: string;

  @ApiProperty({ enum: TipoPasaporte, example: 'ORDINARIO' })
  @IsEnum(TipoPasaporte, { message: 'Tipo de pasaporte inválido' })
  tipo: TipoPasaporte;

  @ApiProperty({ example: 'A123456', description: 'Número de pasaporte (letra + 6 números)' })
  @IsString()
  @IsNotEmpty({ message: 'El número de pasaporte es requerido' })
  @Matches(/^[A-Z]\d{6}$/, { message: 'El número de pasaporte debe tener el formato: letra + 6 números (ej: A123456)' })
  numero: string;

  @ApiProperty({ example: '2023-01-15', description: 'Fecha de expedición' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty({ message: 'La fecha de expedición es requerida' })
  fechaExpedicion: Date;

  @ApiProperty({ example: '2033-01-15', description: 'Fecha de vencimiento' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty({ message: 'La fecha de vencimiento es requerida' })
  fechaVencimiento: Date;

  @ApiPropertyOptional({ example: 'HABANA', description: 'Lugar de expedición' })
  @IsString()
  @IsOptional()
  lugarExpedicion?: string;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsString()
  @IsOptional()
  observaciones?: string;
}

export class UpdatePasaporteDto extends CreatePasaporteDto {}

export class PasaporteFilterDto {
  @ApiPropertyOptional({ description: 'ID del profesor' })
  @IsUUID()
  @IsOptional()
  profesorId?: string;

  @ApiPropertyOptional({ description: 'Buscar por número' })
  @IsString()
  @IsOptional()
  numero?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado de vencimiento', example: 'proximos' })
  @IsString()
  @IsOptional()
  estado?: 'vencidos' | 'proximos' | 'vigentes';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  limit?: number;
}

export class GenerarSolicitudDto {
  @ApiProperty({ description: 'ID del pasaporte' })
  @IsUUID()
  @IsNotEmpty()
  pasaporteId: string;

  @ApiPropertyOptional({ example: 'Director General', description: 'Nombre del firmante' })
  @IsString()
  @IsOptional()
  firmante?: string;

  @ApiPropertyOptional({ example: 'Director', description: 'Cargo del firmante' })
  @IsString()
  @IsOptional()
  cargoFirmante?: string;
}

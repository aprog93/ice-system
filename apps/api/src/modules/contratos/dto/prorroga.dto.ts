import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProrrogaDto {
  @ApiProperty({ description: 'ID del contrato' })
  @IsUUID()
  @IsNotEmpty({ message: 'El contrato es requerido' })
  contratoId: string;

  @ApiProperty({ example: '2025-01-15', description: 'Fecha de inicio de la prórroga' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty({ message: 'La fecha de inicio es requerida' })
  fechaDesde: Date;

  @ApiProperty({ example: '2025-06-15', description: 'Fecha de fin de la prórroga' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty({ message: 'La fecha de fin es requerida' })
  fechaHasta: Date;

  @ApiProperty({ example: 'Extensión de proyecto', description: 'Motivo de la prórroga' })
  @IsString()
  @IsNotEmpty({ message: 'El motivo es requerido' })
  motivo: string;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsString()
  @IsOptional()
  observaciones?: string;
}

export class UpdateProrrogaDto extends CreateProrrogaDto {}

export class ProrrogaFilterDto {
  @ApiPropertyOptional({ description: 'ID del contrato' })
  @IsUUID()
  @IsOptional()
  contratoId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  limit?: number;
}

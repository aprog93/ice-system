import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  Min,
  IsDecimal,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoContrato } from '@prisma/client';

export class CreateContratoDto {
  @ApiProperty({ description: 'ID del profesor' })
  @IsUUID()
  @IsNotEmpty({ message: 'El profesor es requerido' })
  profesorId: string;

  @ApiProperty({ description: 'ID del país' })
  @IsUUID()
  @IsNotEmpty({ message: 'El país es requerido' })
  paisId: string;

  @ApiProperty({ example: '2024-01-15', description: 'Fecha de inicio de la misión' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty({ message: 'La fecha de inicio es requerida' })
  fechaInicio: Date;

  @ApiProperty({ example: '2024-12-15', description: 'Fecha de fin de la misión' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty({ message: 'La fecha de fin es requerida' })
  fechaFin: Date;

  @ApiProperty({ example: 'Profesor de Matemáticas', description: 'Función a desempeñar' })
  @IsString()
  @IsNotEmpty({ message: 'La función es requerida' })
  funcion: string;

  @ApiProperty({ example: 'Escuela Primaria XYZ', description: 'Centro de trabajo' })
  @IsString()
  @IsNotEmpty({ message: 'El centro de trabajo es requerido' })
  centroTrabajo: string;

  @ApiPropertyOptional({ example: 'Calle 123, Ciudad', description: 'Dirección del trabajo' })
  @IsString()
  @IsOptional()
  direccionTrabajo?: string;

  @ApiPropertyOptional({ example: 1500.00, description: 'Salario mensual' })
  @IsDecimal({ decimal_digits: '2' })
  @IsOptional()
  salarioMensual?: string;

  @ApiPropertyOptional({ example: 'USD', description: 'Moneda del salario' })
  @IsString()
  @IsOptional()
  moneda?: string;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsString()
  @IsOptional()
  observaciones?: string;
}

export class UpdateContratoDto extends CreateContratoDto {}

export class CerrarContratoDto {
  @ApiProperty({ example: '2024-12-15', description: 'Fecha de cierre' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty({ message: 'La fecha de cierre es requerida' })
  fechaCierre: Date;

  @ApiProperty({ example: 'Finalización normal de la misión', description: 'Motivo del cierre' })
  @IsString()
  @IsNotEmpty({ message: 'El motivo del cierre es requerido' })
  motivoCierre: string;
}

export class ContratoFilterDto {
  @ApiPropertyOptional({ description: 'ID del profesor' })
  @IsUUID()
  @IsOptional()
  profesorId?: string;

  @ApiPropertyOptional({ description: 'ID del país' })
  @IsUUID()
  @IsOptional()
  paisId?: string;

  @ApiPropertyOptional({ enum: EstadoContrato })
  @IsEnum(EstadoContrato)
  @IsOptional()
  estado?: EstadoContrato;

  @ApiPropertyOptional({ example: 2024 })
  @IsNumber()
  @IsOptional()
  ano?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  limit?: number;
}

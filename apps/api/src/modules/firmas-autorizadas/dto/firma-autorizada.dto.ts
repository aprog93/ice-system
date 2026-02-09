import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFirmaAutorizadaDto {
  @ApiProperty({ example: 'JUAN', description: 'Nombre de la persona autorizada' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @ApiProperty({ example: 'PEREZ GARCIA', description: 'Apellidos de la persona autorizada' })
  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son requeridos' })
  apellidos: string;

  @ApiProperty({ example: 'DIRECTOR GENERAL', description: 'Cargo de la persona autorizada' })
  @IsString()
  @IsNotEmpty({ message: 'El cargo es requerido' })
  cargo: string;

  @ApiPropertyOptional({ example: true, description: 'Si está activa como firmante' })
  @IsBoolean()
  @IsOptional()
  activa?: boolean;
}

export class UpdateFirmaAutorizadaDto extends CreateFirmaAutorizadaDto {}

export class FirmaAutorizadaFilterDto {
  @ApiPropertyOptional({ description: 'Buscar por nombre o apellidos' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado activo' })
  @IsBoolean()
  @IsOptional()
  activa?: boolean;
}

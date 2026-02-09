import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  Min,
  Max,
  IsEmail,
  Length,
  Matches,
  IsDecimal,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sexo, EstadoCivil, NivelIngles, EstadoPotencial } from '@prisma/client';

export class CreateProfesorDto {
  @ApiProperty({ example: '12345678901', description: 'Carnet de identidad' })
  @IsString()
  @IsNotEmpty({ message: 'El CI es requerido' })
  @Length(11, 11, { message: 'El CI debe tener 11 caracteres' })
  ci: string;

  @ApiProperty({ example: 'JUAN', description: 'Nombre del profesor' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @ApiProperty({ example: 'PEREZ GARCIA', description: 'Apellidos del profesor' })
  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son requeridos' })
  apellidos: string;

  @ApiPropertyOptional({ example: 35, description: 'Edad del profesor' })
  @IsNumber()
  @Min(18, { message: 'La edad mínima es 18 años' })
  @Max(80, { message: 'La edad máxima es 80 años' })
  @IsOptional()
  edad?: number;

  @ApiPropertyOptional({ enum: Sexo, example: 'MASCULINO' })
  @IsEnum(Sexo, { message: 'Sexo inválido' })
  @IsOptional()
  sexo?: Sexo;

  @ApiPropertyOptional({ example: 'BLANCA', description: 'Color de piel' })
  @IsString()
  @IsOptional()
  colorPiel?: string;

  @ApiPropertyOptional({ example: 'AZULES', description: 'Color de ojos' })
  @IsString()
  @IsOptional()
  colorOjos?: string;

  @ApiPropertyOptional({ example: 'NEGRO', description: 'Color de pelo' })
  @IsString()
  @IsOptional()
  colorPelo?: string;

  @ApiPropertyOptional({ example: 1.75, description: 'Estatura en metros' })
  @IsDecimal({ decimal_digits: '2' })
  @IsOptional()
  estatura?: string;

  @ApiPropertyOptional({ example: 70, description: 'Peso en kg' })
  @IsDecimal({ decimal_digits: '2' })
  @IsOptional()
  peso?: string;

  @ApiPropertyOptional({ example: 'CICATRIZ EN LA FRENTE', description: 'Señas particulares' })
  @IsString()
  @IsOptional()
  senasParticulares?: string;

  @ApiPropertyOptional({ example: 'CALLE 123 ENTRE A Y B' })
  @IsString()
  @IsOptional()
  direccion?: string;

  // Campos para formulario X-22
  @ApiPropertyOptional({ example: '1990-05-15', description: 'Fecha de nacimiento' })
  @IsString()
  @IsOptional()
  fechaNacimiento?: string;

  @ApiPropertyOptional({ description: 'ID del país de nacimiento' })
  @IsUUID()
  @IsOptional()
  paisNacimientoId?: string;

  @ApiPropertyOptional({ example: 'Madrid', description: 'Ciudad en el extranjero' })
  @IsString()
  @IsOptional()
  ciudadEnElExtranjero?: string;

  @ApiPropertyOptional({ example: 'Calle 123', description: 'Calle' })
  @IsString()
  @IsOptional()
  calle?: string;

  @ApiPropertyOptional({ example: '456', description: 'Número de casa' })
  @IsString()
  @IsOptional()
  numero?: string;

  @ApiPropertyOptional({ example: 'A y B', description: 'Entre calles' })
  @IsString()
  @IsOptional()
  entreCalles?: string;

  @ApiPropertyOptional({ example: 'Apto 2', description: 'Apartamento' })
  @IsString()
  @IsOptional()
  apto?: string;

  @ApiPropertyOptional({ example: '10400', description: 'Código postal' })
  @IsString()
  @IsOptional()
  cpa?: string;

  @ApiPropertyOptional({ example: 'Finca 123', description: 'Finca' })
  @IsString()
  @IsOptional()
  finca?: string;

  @ApiPropertyOptional({ example: 'Localidad', description: 'Localidad' })
  @IsString()
  @IsOptional()
  localidad?: string;

  @ApiPropertyOptional({ example: 'Circunscripción 1', description: 'Circunscripción' })
  @IsString()
  @IsOptional()
  circunscripcion?: string;

  @ApiPropertyOptional({ example: 'Carretera Central', description: 'Carretera' })
  @IsString()
  @IsOptional()
  carretera?: string;

  @ApiPropertyOptional({ example: 'Km 5', description: 'Kilómetro' })
  @IsString()
  @IsOptional()
  km?: string;

  @ApiPropertyOptional({ description: 'ID de la provincia' })
  @IsUUID()
  @IsOptional()
  provinciaId?: string;

  @ApiPropertyOptional({ description: 'ID del municipio' })
  @IsUUID()
  @IsOptional()
  municipioId?: string;

  @ApiPropertyOptional({ description: 'ID del cargo' })
  @IsUUID()
  @IsOptional()
  cargoId?: string;

  @ApiPropertyOptional({ description: 'ID de la especialidad' })
  @IsUUID()
  @IsOptional()
  especialidadId?: string;

  @ApiPropertyOptional({ description: 'ID de la categoría docente' })
  @IsUUID()
  @IsOptional()
  categoriaDocenteId?: string;

  @ApiPropertyOptional({ example: 10, description: 'Años de experiencia' })
  @IsNumber()
  @Min(0, { message: 'Los años de experiencia no pueden ser negativos' })
  @IsOptional()
  anosExperiencia?: number;

  @ApiPropertyOptional({ enum: EstadoCivil, example: 'CASADO' })
  @IsEnum(EstadoCivil, { message: 'Estado civil inválido' })
  @IsOptional()
  estadoCivil?: EstadoCivil;

  @ApiPropertyOptional({ example: 2, description: 'Cantidad de hijos' })
  @IsNumber()
  @Min(0, { message: 'La cantidad de hijos no puede ser negativa' })
  @IsOptional()
  cantidadHijos?: number;

  @ApiPropertyOptional({ example: '71234567' })
  @IsString()
  @IsOptional()
  telefonoFijo?: string;

  @ApiPropertyOptional({ example: '51234567' })
  @IsString()
  @IsOptional()
  telefonoMovil?: string;

  @ApiPropertyOptional({ example: 'juan.perez@email.cu' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ enum: NivelIngles, example: 'INTERMEDIO' })
  @IsEnum(NivelIngles, { message: 'Nivel de inglés inválido' })
  @IsOptional()
  nivelIngles?: NivelIngles;

  @ApiPropertyOptional({ example: 2010 })
  @IsNumber()
  @IsOptional()
  anoGraduado?: number;

  @ApiPropertyOptional({ example: 'Universidad de La Habana' })
  @IsString()
  @IsOptional()
  centroGraduacion?: string;

  @ApiPropertyOptional({ example: 4.5 })
  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  notaPromedio?: number;

  @ApiPropertyOptional({ enum: EstadoPotencial, example: 'ACTIVO' })
  @IsEnum(EstadoPotencial, { message: 'Estado potencial inválido' })
  @IsOptional()
  estadoPotencial?: EstadoPotencial;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  observaciones?: string;

  @ApiPropertyOptional({ example: 'PEDRO PEREZ', description: 'Nombre del padre' })
  @IsString()
  @IsOptional()
  nombrePadre?: string;

  @ApiPropertyOptional({ example: 'MARIA GARCIA', description: 'Nombre de la madre' })
  @IsString()
  @IsOptional()
  nombreMadre?: string;

  @ApiPropertyOptional({ example: 'ANA LOPEZ', description: 'Nombre del cónyuge' })
  @IsString()
  @IsOptional()
  conyuge?: string;

  @ApiPropertyOptional({ example: true, description: 'Militante del PCC' })
  @IsBoolean()
  @IsOptional()
  militanciaPCC?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Militante de la UJC' })
  @IsBoolean()
  @IsOptional()
  militanciaUJC?: boolean;

  @ApiPropertyOptional({ example: 'CONTRATO', description: 'Sale por (Acción de Colaboración)' })
  @IsString()
  @IsOptional()
  accionColaboracion?: string;

  @ApiPropertyOptional({
    example: 'CARLOS PEREZ',
    description: 'Nombre del familiar en caso de aviso',
  })
  @IsString()
  @IsOptional()
  familiarAvisoNombre?: string;

  @ApiPropertyOptional({
    example: '51234567',
    description: 'Teléfono del familiar en caso de aviso',
  })
  @IsString()
  @IsOptional()
  familiarAvisoTelefono?: string;
}

export class UpdateProfesorDto extends CreateProfesorDto {}

export class ProfesorFilterDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  provinciaId?: string;

  @ApiPropertyOptional({ enum: EstadoPotencial })
  @IsEnum(EstadoPotencial)
  @IsOptional()
  estadoPotencial?: EstadoPotencial;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsNumber()
  @IsOptional()
  limit?: number;
}

export class ImportarExcelDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Archivo Excel (.xlsx)' })
  archivo: any;
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { PapeleraService } from '@/modules/papelera/papelera.service';
import { CreateProfesorDto, UpdateProfesorDto, ProfesorFilterDto } from '../dto/profesor.dto';
import { normalizarTexto } from '@/common/utils/string.utils';
import { TipoRegistroPapelera } from '@prisma/client';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ProfesoresService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => PapeleraService))
    private papeleraService: PapeleraService,
  ) {}

  async findAll(filters: ProfesorFilterDto) {
    const { search, provinciaId, estadoPotencial, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      const searchNormalized = normalizarTexto(search);
      where.OR = [
        { nombre: { contains: searchNormalized, mode: 'insensitive' } },
        { apellidos: { contains: searchNormalized, mode: 'insensitive' } },
        { ci: { contains: searchNormalized } },
      ];
    }

    if (provinciaId) {
      where.provinciaId = provinciaId;
    }

    if (estadoPotencial) {
      where.estadoPotencial = estadoPotencial;
    }

    const [profesores, total] = await Promise.all([
      this.prisma.profesor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          provincia: true,
          municipio: true,
          cargo: true,
          especialidad: true,
          categoriaDocente: true,
          paisNacimiento: true,
          _count: {
            select: {
              pasaportes: true,
              contratos: true,
            },
          },
        },
      }),
      this.prisma.profesor.count({ where }),
    ]);

    return {
      data: profesores,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const profesor = await this.prisma.profesor.findUnique({
      where: { id },
      include: {
        provincia: true,
        municipio: true,
        cargo: true,
        especialidad: true,
        categoriaDocente: true,
        paisNacimiento: true,
        pasaportes: {
          where: { activo: true },
          orderBy: { fechaVencimiento: 'desc' },
        },
        contratos: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!profesor) {
      throw new NotFoundException('Profesor no encontrado');
    }

    return profesor;
  }

  async create(createDto: CreateProfesorDto, userId: string) {
    // Check if CI already exists
    const existing = await this.prisma.profesor.findUnique({
      where: { ci: createDto.ci },
    });

    if (existing) {
      throw new ConflictException('Ya existe un profesor con este CI');
    }

    // Extract relation IDs for connect
    const {
      provinciaId,
      municipioId,
      cargoId,
      especialidadId,
      categoriaDocenteId,
      paisNacimientoId,
      fechaNacimiento,
      ...rest
    } = createDto;

    // Normalize text fields
    const data: any = {
      ...rest,
      ci: createDto.ci,
      nombre: normalizarTexto(createDto.nombre),
      apellidos: normalizarTexto(createDto.apellidos),
      edad: createDto.edad,
      sexo: createDto.sexo,
      estadoCivil: createDto.estadoCivil,
      nivelIngles: createDto.nivelIngles,
      direccion: createDto.direccion ? normalizarTexto(createDto.direccion) : undefined,
      colorOjos: createDto.colorOjos?.toUpperCase(),
      colorPelo: createDto.colorPelo?.toUpperCase(),
      senasParticulares: createDto.senasParticulares
        ? normalizarTexto(createDto.senasParticulares)
        : undefined,
      centroGraduacion: createDto.centroGraduacion
        ? normalizarTexto(createDto.centroGraduacion)
        : undefined,
      observaciones: createDto.observaciones ? normalizarTexto(createDto.observaciones) : undefined,
      createdBy: userId,
    };

    // Solo conectar provincia/municipio si tienen valor válido
    if (provinciaId) {
      data.provincia = { connect: { id: provinciaId } };
    }
    if (municipioId) {
      data.municipio = { connect: { id: municipioId } };
    }

    // Convertir estatura y peso a número (vienen como string del DTO)
    if (createDto.estatura && createDto.estatura !== '0' && createDto.estatura !== '') {
      data.estatura = parseFloat(createDto.estatura);
    } else {
      delete data.estatura;
    }

    if (createDto.peso && createDto.peso !== '0' && createDto.peso !== '') {
      data.peso = parseFloat(createDto.peso);
    } else {
      delete data.peso;
    }

    // Limpiar campos vacíos o con valor 0 que deben ser opcionales
    if (createDto.anoGraduado === 0) delete data.anoGraduado;
    if (createDto.notaPromedio === 0) delete data.notaPromedio;

    // Convertir fechaNacimiento a formato ISO para Prisma
    if (fechaNacimiento) {
      data.fechaNacimiento = new Date(fechaNacimiento).toISOString();
    }

    if (cargoId) data.cargo = { connect: { id: cargoId } };
    if (especialidadId) data.especialidad = { connect: { id: especialidadId } };
    if (categoriaDocenteId) data.categoriaDocente = { connect: { id: categoriaDocenteId } };
    if (paisNacimientoId) data.paisNacimiento = { connect: { id: paisNacimientoId } };

    return this.prisma.profesor.create({
      data,
      include: {
        provincia: true,
        municipio: true,
        cargo: true,
        especialidad: true,
        categoriaDocente: true,
        paisNacimiento: true,
      },
    });
  }

  async update(id: string, updateDto: UpdateProfesorDto, userId: string) {
    const profesor = await this.prisma.profesor.findUnique({
      where: { id },
    });

    if (!profesor) {
      throw new NotFoundException('Profesor no encontrado');
    }

    // Check if CI is being changed and already exists
    if (updateDto.ci && updateDto.ci !== profesor.ci) {
      const existing = await this.prisma.profesor.findUnique({
        where: { ci: updateDto.ci },
      });

      if (existing) {
        throw new ConflictException('Ya existe un profesor con este CI');
      }
    }

    // Extract relation IDs
    const {
      provinciaId,
      municipioId,
      cargoId,
      especialidadId,
      categoriaDocenteId,
      paisNacimientoId,
      fechaNacimiento,
      ...rest
    } = updateDto;

    // Normalize text fields
    const data: any = {
      ...rest,
      nombre: normalizarTexto(updateDto.nombre),
      apellidos: normalizarTexto(updateDto.apellidos),
      direccion: updateDto.direccion ? normalizarTexto(updateDto.direccion) : undefined,
      colorOjos: updateDto.colorOjos?.toUpperCase(),
      colorPelo: updateDto.colorPelo?.toUpperCase(),
      senasParticulares: updateDto.senasParticulares
        ? normalizarTexto(updateDto.senasParticulares)
        : undefined,
      centroGraduacion: updateDto.centroGraduacion
        ? normalizarTexto(updateDto.centroGraduacion)
        : undefined,
      observaciones: updateDto.observaciones ? normalizarTexto(updateDto.observaciones) : undefined,
      updatedBy: userId,
    };

    // Convertir estatura y peso a número (vienen como string del DTO)
    if (updateDto.estatura && updateDto.estatura !== '0' && updateDto.estatura !== '') {
      data.estatura = parseFloat(updateDto.estatura);
    } else if (updateDto.estatura === '' || updateDto.estatura === '0') {
      data.estatura = null; // Para resetear el valor
    }

    if (updateDto.peso && updateDto.peso !== '0' && updateDto.peso !== '') {
      data.peso = parseFloat(updateDto.peso);
    } else if (updateDto.peso === '' || updateDto.peso === '0') {
      data.peso = null; // Para resetear el valor
    }

    // Limpiar campos con valor 0 que deben ser opcionales
    if (updateDto.anoGraduado === 0) data.anoGraduado = null;
    if (updateDto.notaPromedio === 0) data.notaPromedio = null;

    // Convertir fechaNacimiento a formato ISO para Prisma
    if (fechaNacimiento) {
      data.fechaNacimiento = new Date(fechaNacimiento).toISOString();
    } else if (fechaNacimiento === null) {
      data.fechaNacimiento = null;
    }

    // Handle relations
    if (provinciaId) data.provincia = { connect: { id: provinciaId } };
    if (municipioId) data.municipio = { connect: { id: municipioId } };
    if (cargoId) data.cargo = { connect: { id: cargoId } };
    else if (cargoId === null) data.cargo = { disconnect: true };
    if (especialidadId) data.especialidad = { connect: { id: especialidadId } };
    else if (especialidadId === null) data.especialidad = { disconnect: true };
    if (categoriaDocenteId) data.categoriaDocente = { connect: { id: categoriaDocenteId } };
    else if (categoriaDocenteId === null) data.categoriaDocente = { disconnect: true };
    if (paisNacimientoId) data.paisNacimiento = { connect: { id: paisNacimientoId } };
    else if (paisNacimientoId === null) data.paisNacimiento = { disconnect: true };

    return this.prisma.profesor.update({
      where: { id },
      data,
      include: {
        provincia: true,
        municipio: true,
        cargo: true,
        especialidad: true,
        categoriaDocente: true,
        paisNacimiento: true,
      },
    });
  }

  async remove(id: string, userId: string, userName?: string) {
    const profesor = await this.prisma.profesor.findUnique({
      where: { id },
      include: {
        contratos: {
          where: {
            estado: { in: ['ACTIVO', 'PRORROGADO'] },
          },
        },
      },
    });

    if (!profesor) {
      throw new NotFoundException('Profesor no encontrado');
    }

    if (profesor.contratos.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar el profesor porque tiene contratos activos',
      );
    }

    // Mover a papelera antes de eliminar
    await this.papeleraService.moverAPapelera(
      TipoRegistroPapelera.PROFESOR,
      id,
      profesor,
      userId,
      userName,
      'Eliminación desde el listado de profesores',
    );

    await this.prisma.profesor.delete({
      where: { id },
    });
  }

  async importarExcel(archivo: Express.Multer.File, userId: string) {
    if (!archivo) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(archivo.buffer as any);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new BadRequestException('El archivo Excel no tiene hojas válidas');
    }

    const resultados = {
      creados: 0,
      actualizados: 0,
      errores: [] as { fila: number; error: string }[],
    };

    // Get nomencladores for validation
    const [provincias, municipios, cargos, especialidades, categorias] = await Promise.all([
      this.prisma.provincia.findMany(),
      this.prisma.municipio.findMany(),
      this.prisma.cargo.findMany(),
      this.prisma.especialidad.findMany(),
      this.prisma.categoriaDocente.findMany(),
    ]);

    let rowIndex = 2; // Skip header row
    for (const row of worksheet.getRows(2, worksheet.rowCount - 1) || []) {
      try {
        const ci = row.getCell(1).value?.toString().trim();
        const nombre = row.getCell(2).value?.toString().trim();
        const apellidos = row.getCell(3).value?.toString().trim();
        const edad = parseInt(row.getCell(4).value?.toString() || '0');
        const sexo = row.getCell(5).value?.toString().trim().toUpperCase();
        const provinciaNombre = row.getCell(6).value?.toString().trim().toUpperCase();
        const municipioNombre = row.getCell(7).value?.toString().trim().toUpperCase();

        if (!ci || !nombre || !apellidos) {
          resultados.errores.push({ fila: rowIndex, error: 'Datos obligatorios faltantes' });
          rowIndex++;
          continue;
        }

        // Find provincia and municipio
        const provincia = provincias.find(
          (p) => normalizarTexto(p.nombre) === normalizarTexto(provinciaNombre),
        );
        const municipio = municipios.find(
          (m) => normalizarTexto(m.nombre) === normalizarTexto(municipioNombre),
        );

        if (!provincia || !municipio) {
          resultados.errores.push({
            fila: rowIndex,
            error: `Provincia o municipio no encontrados: ${provinciaNombre}, ${municipioNombre}`,
          });
          rowIndex++;
          continue;
        }

        // Try to find existing profesor
        const existing = await this.prisma.profesor.findUnique({
          where: { ci },
        });

        if (existing) {
          await this.prisma.profesor.update({
            where: { id: existing.id },
            data: {
              nombre: normalizarTexto(nombre),
              apellidos: normalizarTexto(apellidos),
              edad,
              sexo: sexo === 'F' ? 'FEMENINO' : 'MASCULINO',
              estadoCivil: 'SOLTERO',
              nivelIngles: 'BASICO',
              updatedBy: userId,
              provincia: { connect: { id: provincia.id } },
              municipio: { connect: { id: municipio.id } },
            },
          });
          resultados.actualizados++;
        } else {
          await this.prisma.profesor.create({
            data: {
              ci,
              nombre: normalizarTexto(nombre),
              apellidos: normalizarTexto(apellidos),
              edad,
              sexo: sexo === 'F' ? 'FEMENINO' : 'MASCULINO',
              estadoCivil: 'SOLTERO',
              nivelIngles: 'BASICO',
              createdBy: userId,
              provincia: { connect: { id: provincia.id } },
              municipio: { connect: { id: municipio.id } },
            },
          });
          resultados.creados++;
        }
      } catch (error) {
        resultados.errores.push({
          fila: rowIndex,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
      rowIndex++;
    }

    return resultados;
  }

  async exportarExcel(filters: ProfesorFilterDto) {
    const { data: profesores } = await this.findAll({ ...filters, page: 1, limit: 10000 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Profesores');

    // Add headers
    worksheet.columns = [
      { header: 'CI', key: 'ci', width: 15 },
      { header: 'Nombre', key: 'nombre', width: 20 },
      { header: 'Apellidos', key: 'apellidos', width: 25 },
      { header: 'Edad', key: 'edad', width: 10 },
      { header: 'Sexo', key: 'sexo', width: 12 },
      { header: 'Color Ojos', key: 'colorOjos', width: 15 },
      { header: 'Color Pelo', key: 'colorPelo', width: 15 },
      { header: 'Estatura', key: 'estatura', width: 12 },
      { header: 'Peso', key: 'peso', width: 10 },
      { header: 'Provincia', key: 'provincia', width: 20 },
      { header: 'Municipio', key: 'municipio', width: 20 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Teléfono Móvil', key: 'telefonoMovil', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
    ];

    // Add data
    for (const profesor of profesores) {
      worksheet.addRow({
        ci: profesor.ci,
        nombre: profesor.nombre,
        apellidos: profesor.apellidos,
        edad: profesor.edad,
        sexo: profesor.sexo,
        colorOjos: profesor.colorOjos,
        colorPelo: profesor.colorPelo,
        estatura: profesor.estatura,
        peso: profesor.peso,
        provincia: profesor.provincia?.nombre,
        municipio: profesor.municipio?.nombre,
        estado: profesor.estadoPotencial,
        telefonoMovil: profesor.telefonoMovil,
        email: profesor.email,
      });
    }

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}

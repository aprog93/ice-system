import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import * as XLSX from 'xlsx';

interface ImportacionResultado {
  exitosos: number;
  errores: number;
  saltadosExistentes: number; // Pasaportes que ya existen en el sistema
  saltadosSinProfesor: number; // Pasaportes cuyo profesor no está en Potencial
  totalSaltados: number;
  detalles: Array<{
    fila: number;
    numeroPasaporte: string;
    colaborador: string;
    estado: 'EXITO' | 'ERROR' | 'SALTADO';
    razonSalto?: 'EXISTENTE' | 'SIN_PROFESOR';
    mensaje: string;
    pasaporteId?: string;
  }>;
}

@Injectable()
export class PasaportesImportService {
  constructor(private readonly prisma: PrismaService) {}

  async importarDesdeCsv(
    buffer: Buffer,
    nombreArchivo: string,
    userId: string,
  ): Promise<{ resumen: ImportacionResultado; historialId: string }> {
    // Parsear CSV
    const registros = this.parsearCsv(buffer);

    const resultado: ImportacionResultado = {
      exitosos: 0,
      errores: 0,
      saltadosExistentes: 0,
      saltadosSinProfesor: 0,
      totalSaltados: 0,
      detalles: [],
    };

    // Procesar cada registro
    for (let i = 0; i < registros.length; i++) {
      const registro = registros[i];
      const filaNumero = i + 2; // +2 porque CSV empieza en 1 y tiene header

      try {
        const resultadoProceso = await this.procesarRegistro(registro, filaNumero);

        resultado.detalles.push(resultadoProceso);

        if (resultadoProceso.estado === 'EXITO') {
          resultado.exitosos++;
        } else if (resultadoProceso.estado === 'SALTADO') {
          resultado.totalSaltados++;
          if (resultadoProceso.razonSalto === 'SIN_PROFESOR') {
            resultado.saltadosSinProfesor++;
          } else {
            resultado.saltadosExistentes++;
          }
        } else {
          resultado.errores++;
        }
      } catch (error) {
        resultado.errores++;
        resultado.detalles.push({
          fila: filaNumero,
          numeroPasaporte: registro.pasaporte || 'N/A',
          colaborador: registro.colaborador || 'N/A',
          estado: 'ERROR',
          mensaje: error.message || 'Error desconocido',
        });
      }
    }

    // Guardar en historial
    const historial = await this.prisma.importacionHistorial.create({
      data: {
        tipo: 'PASAPORTES',
        nombreArchivo,
        totalRegistros: registros.length,
        exitosos: resultado.exitosos,
        errores: resultado.errores,
        saltados: resultado.totalSaltados,
        detalle: resultado.detalles as any,
        userId,
      },
    });

    return {
      resumen: resultado,
      historialId: historial.id,
    };
  }

  private parsearCsv(buffer: Buffer): Array<any> {
    try {
      const content = buffer.toString('utf-8');
      const lines = content.split('\n');

      if (lines.length < 2) {
        throw new Error('El archivo CSV está vacío o no tiene datos');
      }

      // Parsear header
      const headers = this.parsearLineaCsv(lines[0]);

      const records: any[] = [];

      // Parsear cada línea de datos
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = this.parsearLineaCsv(line);
        if (values.length !== headers.length) continue;

        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index]?.trim() || '';
        });

        // Filtrar filas vacías y de sección (A, B, C...)
        const pasaporte = record['Pasaporte #']?.trim() || '';
        const colaborador = record['Colaborador']?.trim() || '';

        // Detectar filas de sección: solo una letra mayúscula
        const esSeccion = /^[A-Z]$/.test(pasaporte) || /^[A-Z]$/.test(colaborador);

        // Detectar filas vacías
        const estaVacia = !pasaporte && !colaborador;

        // Validar: debe tener pasaporte (>1 char) y colaborador (cualquier texto con longitud > 3)
        const tienePasaporteValido = pasaporte.length > 1;
        const tieneColaboradorValido = colaborador.length > 3;

        if (tienePasaporteValido && tieneColaboradorValido && !esSeccion) {
          records.push(record);
        }
      }

      return records;
    } catch (error) {
      throw new BadRequestException('Error al parsear el archivo CSV: ' + error.message);
    }
  }

  private parsearLineaCsv(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current);
    return values;
  }

  private async procesarRegistro(
    registro: any,
    fila: number,
  ): Promise<{
    fila: number;
    numeroPasaporte: string;
    colaborador: string;
    estado: 'EXITO' | 'ERROR' | 'SALTADO';
    razonSalto?: 'EXISTENTE' | 'SIN_PROFESOR';
    mensaje: string;
    pasaporteId?: string;
  }> {
    const numeroPasaporte = registro['Pasaporte #']?.trim();
    const numeroArchivo = registro['No. Archivo']?.trim();
    const colaborador = registro['Colaborador']?.trim();
    const fechaVencimiento = registro['Fecha Vencimiento']?.trim();
    const ubicacion = registro['Ubicación']?.trim();

    // Validaciones básicas
    if (!numeroPasaporte) {
      return {
        fila,
        numeroPasaporte: 'N/A',
        colaborador: colaborador || 'N/A',
        estado: 'ERROR',
        mensaje: 'Número de pasaporte vacío',
      };
    }

    if (!colaborador) {
      return {
        fila,
        numeroPasaporte,
        colaborador: 'N/A',
        estado: 'ERROR',
        mensaje: 'Nombre del colaborador vacío',
      };
    }

    // Verificar si el pasaporte ya existe
    const pasaporteExistente = await this.prisma.pasaporte.findUnique({
      where: { numero: numeroPasaporte },
    });

    if (pasaporteExistente) {
      return {
        fila,
        numeroPasaporte,
        colaborador,
        estado: 'SALTADO',
        razonSalto: 'EXISTENTE',
        mensaje: `Pasaporte ${numeroPasaporte} ya existe en el sistema y fue saltado.`,
        pasaporteId: pasaporteExistente.id,
      };
    }

    // Buscar profesor por nombre exacto
    // Formato CSV: "APELLIDO1 APELLIDO2, NOMBRE"
    const profesor = await this.buscarProfesorExacto(colaborador);

    if (!profesor) {
      return {
        fila,
        numeroPasaporte,
        colaborador,
        estado: 'SALTADO',
        razonSalto: 'SIN_PROFESOR',
        mensaje: `Profesor "${colaborador}" no existe en Potencial. Crear el profesor primero para importar este pasaporte.`,
      };
    }

    // Parsear fecha de vencimiento (formato: 3/14/2024 = MM/DD/YYYY)
    let fechaVenc: Date | undefined;
    if (fechaVencimiento) {
      try {
        const [mes, dia, anio] = fechaVencimiento.split('/').map(Number);
        fechaVenc = new Date(anio, mes - 1, dia);

        if (isNaN(fechaVenc.getTime())) {
          throw new Error('Fecha inválida');
        }
      } catch {
        return {
          fila,
          numeroPasaporte,
          colaborador,
          estado: 'ERROR',
          mensaje: `Fecha de vencimiento inválida: ${fechaVencimiento}. Formato esperado: MM/DD/YYYY`,
        };
      }
    }

    // Crear pasaporte
    const pasaporte = await this.prisma.pasaporte.create({
      data: {
        profesorId: profesor.id,
        tipo: 'ORDINARIO', // Por defecto
        numero: numeroPasaporte,
        numeroArchivo: numeroArchivo || undefined, // Usar el del CSV si existe
        fechaExpedicion: new Date(), // Fecha actual como default
        fechaVencimiento:
          fechaVenc || new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
        lugarExpedicion: 'HABANA',
        observaciones: ubicacion ? `Ubicación: ${ubicacion}` : undefined,
        activo: true,
      },
    });

    const mensajeExito = `Pasaporte ${numeroPasaporte} creado exitosamente para ${colaborador}`;

    return {
      fila,
      numeroPasaporte,
      colaborador,
      estado: 'EXITO',
      mensaje: mensajeExito,
      pasaporteId: pasaporte.id,
    };
  }

  private async buscarProfesorExacto(nombreCsv: string): Promise<any> {
    // Formato CSV: "APELLIDO1 APELLIDO2, NOMBRE"
    // Formato BD: nombre = "NOMBRE", apellidos = "APELLIDO1 APELLIDO2"

    const partes = nombreCsv.split(',');
    if (partes.length !== 2) {
      return null;
    }

    const apellidos = partes[0].trim();
    const nombre = partes[1].trim();

    console.log(`[Buscar Profesor] Buscando: nombre="${nombre}", apellidos="${apellidos}"`);

    // Intento 1: Búsqueda exacta (case-insensitive)
    let profesor = await this.prisma.profesor.findFirst({
      where: {
        AND: [
          { nombre: { equals: nombre, mode: 'insensitive' } },
          { apellidos: { equals: apellidos, mode: 'insensitive' } },
        ],
      },
    });

    if (profesor) {
      console.log(
        `[Buscar Profesor] Encontrado (exacto): ${profesor.nombre} ${profesor.apellidos}`,
      );
      return profesor;
    }

    // Intento 2: Búsqueda por contención (más permisiva)
    // Buscar profesores donde el nombre del CSV esté contenido en el nombre de la BD
    const profesores = await this.prisma.profesor.findMany({
      where: {
        OR: [
          { apellidos: { contains: apellidos.split(' ')[0], mode: 'insensitive' } },
          { nombre: { contains: nombre.split(' ')[0], mode: 'insensitive' } },
        ],
      },
      take: 5, // Limitar resultados
    });

    if (profesores.length > 0) {
      console.log(`[Buscar Profesor] Candidatos encontrados: ${profesores.length}`);
      profesores.forEach((p) => console.log(`  - ${p.nombre} ${p.apellidos}`));

      // Buscar el mejor match (el que tenga más coincidencias)
      for (const candidato of profesores) {
        const apellidosCsv = apellidos.toLowerCase().split(' ');
        const apellidosBd = (candidato.apellidos || '').toLowerCase().split(' ');
        const nombreCsvLower = nombre.toLowerCase();
        const nombreBdLower = (candidato.nombre || '').toLowerCase();

        // Verificar si al menos un apellido coincide y el nombre coincide
        const apellidoMatch = apellidosCsv.some((a) => apellidosBd.includes(a));
        const nombreMatch =
          nombreBdLower.includes(nombreCsvLower) || nombreCsvLower.includes(nombreBdLower);

        if (apellidoMatch && nombreMatch) {
          console.log(
            `[Buscar Profesor] Mejor match encontrado: ${candidato.nombre} ${candidato.apellidos}`,
          );
          return candidato;
        }
      }
    }

    console.log(`[Buscar Profesor] NO ENCONTRADO para: "${nombreCsv}"`);
    return null;
  }

  async importarDesdeExcel(
    buffer: Buffer,
    nombreArchivo: string,
    userId: string,
  ): Promise<{ resumen: ImportacionResultado; historialId: string }> {
    // Parsear Excel
    const registros = this.parsearExcel(buffer);

    const resultado: ImportacionResultado = {
      exitosos: 0,
      errores: 0,
      saltadosExistentes: 0,
      saltadosSinProfesor: 0,
      totalSaltados: 0,
      detalles: [],
    };

    // Procesar cada registro
    for (let i = 0; i < registros.length; i++) {
      const registro = registros[i];
      const filaNumero = i + 2; // +2 porque Excel empieza en 1 y tiene header

      try {
        const resultadoProceso = await this.procesarRegistro(registro, filaNumero);

        resultado.detalles.push(resultadoProceso);

        if (resultadoProceso.estado === 'EXITO') {
          resultado.exitosos++;
        } else if (resultadoProceso.estado === 'SALTADO') {
          resultado.totalSaltados++;
          if (resultadoProceso.razonSalto === 'SIN_PROFESOR') {
            resultado.saltadosSinProfesor++;
          } else {
            resultado.saltadosExistentes++;
          }
        } else {
          resultado.errores++;
        }
      } catch (error) {
        resultado.errores++;
        resultado.detalles.push({
          fila: filaNumero,
          numeroPasaporte: registro['Pasaporte #'] || 'N/A',
          colaborador: registro['Colaborador'] || 'N/A',
          estado: 'ERROR',
          mensaje: error.message || 'Error desconocido',
        });
      }
    }

    // Guardar en historial
    const historial = await this.prisma.importacionHistorial.create({
      data: {
        tipo: 'PASAPORTES_EXCEL',
        nombreArchivo,
        totalRegistros: registros.length,
        exitosos: resultado.exitosos,
        errores: resultado.errores,
        saltados: resultado.totalSaltados,
        detalle: resultado.detalles as any,
        userId,
      },
    });

    return {
      resumen: resultado,
      historialId: historial.id,
    };
  }

  private parsearExcel(buffer: Buffer): Array<any> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });

      // Buscar la primera hoja que tenga datos (más de 1 fila)
      let worksheet = null;
      let sheetName = '';

      for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        const testData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (testData.length >= 2) {
          worksheet = sheet;
          sheetName = name;
          break;
        }
      }

      if (!worksheet) {
        throw new Error('No se encontró ninguna hoja con datos en el archivo Excel');
      }

      console.log(
        `[Excel Import] Procesando hoja: "${sheetName}" con ${XLSX.utils.sheet_to_json(worksheet, { header: 1 }).length} filas`,
      );

      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (data.length < 2) {
        throw new Error('El archivo Excel está vacío o no tiene datos');
      }

      // Primera fila son los headers
      const headers = data[0] as string[];
      console.log(`[Excel Import] Headers encontrados: ${headers.join(', ')}`);

      const records: any[] = [];

      // Procesar cada fila de datos
      for (let i = 1; i < data.length; i++) {
        const row = data[i] as any[];
        if (!row || row.length === 0) continue;

        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = row[index]?.toString()?.trim() || '';
        });

        // Filtrar filas vacías y de sección (A, B, C...)
        const pasaporte = record['Pasaporte #']?.trim() || '';
        const colaborador = record['Colaborador']?.trim() || '';

        // Logging para debugging (primeras 20 filas)
        if (i <= 20) {
          console.log(`[Fila ${i}] pasaporte="${pasaporte}", colaborador="${colaborador}"`);
        }

        // Detectar filas de sección: solo una letra mayúscula
        const esSeccion = /^[A-Z]$/.test(pasaporte) || /^[A-Z]$/.test(colaborador);

        // Detectar filas vacías
        const estaVacia = !pasaporte && !colaborador;

        // Validar: debe tener pasaporte (>1 char) y colaborador (cualquier texto con longitud > 3)
        const tienePasaporteValido = pasaporte.length > 1;
        const tieneColaboradorValido = colaborador.length > 3;

        if (tienePasaporteValido && tieneColaboradorValido && !esSeccion) {
          records.push(record);
        } else if (i <= 50) {
          // Loggear por qué se descartó (primeras 50 filas)
          const razon = estaVacia
            ? 'VACIA'
            : esSeccion
              ? 'SECCION'
              : !tienePasaporteValido
                ? 'PASAPORTE_CORTO'
                : 'COLABORADOR_CORTO';
          console.log(`[Skip ${i}] ${razon}: "${pasaporte}" / "${colaborador}"`);
        }
      }

      console.log(`[Excel Import] Registros válidos encontrados: ${records.length}`);

      return records;
    } catch (error) {
      throw new BadRequestException('Error al parsear el archivo Excel: ' + error.message);
    }
  }

  async obtenerHistorial(userId: string) {
    return this.prisma.importacionHistorial.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async obtenerDetalleHistorial(historialId: string, userId: string) {
    const historial = await this.prisma.importacionHistorial.findFirst({
      where: {
        id: historialId,
        userId, // Solo puede ver sus propias importaciones
      },
    });

    if (!historial) {
      throw new BadRequestException('Historial no encontrado o no tiene permisos para verlo');
    }

    return historial;
  }
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { Sexo, EstadoCivil, NivelIngles, EstadoPotencial } from '@prisma/client';
import * as ExcelJS from 'exceljs';

interface PotencialRow {
  accion: string;
  numero: string;
  nombresApellidos: string;
  carnetIdentidad: string;
  especialidad: string;
  cargo: string;
  centroTrabajo: string;
  municipio: string;
  misionInterna: string;
}

@Injectable()
export class PotencialImportService {
  constructor(private prisma: PrismaService) {}

  // Separar nombre y apellidos del formato "Apellido1 Apellido2, Nombre"
  private separarNombreApellidos(nombreCompleto: string): { nombre: string; apellidos: string } {
    if (!nombreCompleto || nombreCompleto.trim() === '') {
      return { nombre: '', apellidos: '' };
    }

    // Eliminar títulos como "MSc.", "Lic."
    const sinTitulo = nombreCompleto.replace(/^(MSc\.|Lic\.|Dr\.|Ing\.)\s*/i, '').trim();

    // Buscar si hay coma (formato: "APELLIDO, Nombre")
    const partesComa = sinTitulo.split(',');
    if (partesComa.length === 2) {
      return {
        apellidos: partesComa[0].trim(),
        nombre: partesComa[1].trim(),
      };
    }

    // Si no hay coma, asumir últimas 2 palabras son apellidos
    const palabras = sinTitulo.split(/\s+/);
    if (palabras.length <= 2) {
      return { nombre: palabras[0] || '', apellidos: palabras[1] || '' };
    }

    const apellidos = palabras.slice(-2).join(' ');
    const nombre = palabras.slice(0, -2).join(' ');

    return { nombre, apellidos };
  }

  // Normalizar CI (eliminar espacios y caracteres no numéricos)
  private normalizarCI(ci: string): string {
    if (!ci) return '';
    return ci.replace(/[^0-9]/g, '').trim();
  }

  async importarPotencialExcel(archivo: Express.Multer.File, userId: string) {
    if (!archivo) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(archivo.buffer as any);

    const resultados = {
      hojasProcesadas: [] as string[],
      profesoresCreados: 0,
      profesoresActualizados: 0,
      errores: [] as { fila: number; hoja: string; error: string; datos?: any }[],
    };

    // Procesar cada hoja del archivo
    for (const worksheet of workbook.worksheets) {
      const hojaNombre = worksheet.name;
      console.log(`📄 Procesando hoja: ${hojaNombre}`);

      const hojaResultado = await this.procesarHojaPotencial(worksheet, hojaNombre, userId);

      resultados.hojasProcesadas.push(hojaNombre);
      resultados.profesoresCreados += hojaResultado.creados;
      resultados.profesoresActualizados += hojaResultado.actualizados;
      resultados.errores.push(...hojaResultado.errores);
    }

    return resultados;
  }

  private async procesarHojaPotencial(
    worksheet: ExcelJS.Worksheet,
    hojaNombre: string,
    userId: string,
  ) {
    const resultado = {
      creados: 0,
      actualizados: 0,
      errores: [] as { fila: number; hoja: string; error: string; datos?: any }[],
    };

    // Buscar la fila del encabezado (buscar "Acción" o "No.")
    let headerRow = 1;
    let accionCol = -1;
    let numeroCol = -1;
    let nombresCol = -1;
    let ciCol = -1;
    let especialidadCol = -1;
    let cargoCol = -1;
    let centroTrabajoCol = -1;
    let municipioCol = -1;
    let misionCol = -1;

    // Buscar encabezados en las primeras 10 filas
    for (let rowNum = 1; rowNum <= 10; rowNum++) {
      const row = worksheet.getRow(rowNum);
      let foundHeaders = false;

      row.eachCell((cell, colNumber) => {
        const valor = cell.value?.toString().toUpperCase().trim() || '';

        if (valor.includes('ACCIÓN') || valor.includes('ACCION')) {
          accionCol = colNumber;
          foundHeaders = true;
        } else if (valor === 'NO.' || valor === 'NO') {
          numeroCol = colNumber;
          foundHeaders = true;
        } else if (valor.includes('NOMBRE') && valor.includes('APELLIDO')) {
          nombresCol = colNumber;
          foundHeaders = true;
        } else if (
          valor.includes('CARNÉ') ||
          valor.includes('CARNE') ||
          valor.includes('IDENTIDAD')
        ) {
          ciCol = colNumber;
          foundHeaders = true;
        } else if (valor.includes('ESPECIALIDAD')) {
          especialidadCol = colNumber;
          foundHeaders = true;
        } else if (valor === 'CARGO' || valor.includes('CARGO')) {
          cargoCol = colNumber;
          foundHeaders = true;
        } else if (valor.includes('CENTRO') || valor.includes('TRABAJO')) {
          centroTrabajoCol = colNumber;
          foundHeaders = true;
        } else if (valor.includes('MUNICIPIO')) {
          municipioCol = colNumber;
          foundHeaders = true;
        } else if (valor.includes('MISIÓN') || valor.includes('MISION')) {
          misionCol = colNumber;
          foundHeaders = true;
        }
      });

      if (foundHeaders && nombresCol > 0) {
        headerRow = rowNum;
        break;
      }
    }

    if (nombresCol < 0) {
      console.log(`⚠️ No se encontraron encabezados válidos en la hoja ${hojaNombre}`);
      return resultado;
    }

    console.log(`📋 Encabezados encontrados en fila ${headerRow}:`);
    console.log(
      `   - Nombres: col ${nombresCol}, CI: col ${ciCol}, Especialidad: col ${especialidadCol}`,
    );
    console.log(
      `   - Cargo: col ${cargoCol}, Centro: col ${centroTrabajoCol}, Municipio: col ${municipioCol}`,
    );

    // Obtener nomencladores
    const [provincias, municipios, cargos, especialidades] = await Promise.all([
      this.prisma.provincia.findMany(),
      this.prisma.municipio.findMany(),
      this.prisma.cargo.findMany(),
      this.prisma.especialidad.findMany(),
    ]);

    // Procesar filas de datos
    for (let rowNum = headerRow + 1; rowNum <= worksheet.rowCount; rowNum++) {
      const row = worksheet.getRow(rowNum);

      // Obtener valor del nombre
      const nombreCell = row.getCell(nombresCol).value;
      const nombreCompleto = nombreCell?.toString().trim() || '';

      // Saltar filas vacías o de agrupación (letras sueltas)
      if (!nombreCompleto || nombreCompleto.length < 3 || /^[A-Z]$/.test(nombreCompleto)) {
        continue;
      }

      try {
        // Extraer datos de la fila
        const ci = ciCol > 0 ? this.normalizarCI(row.getCell(ciCol).value?.toString() || '') : '';
        const especialidadNombre =
          especialidadCol > 0 ? row.getCell(especialidadCol).value?.toString().trim() : '';
        const cargoNombre = cargoCol > 0 ? row.getCell(cargoCol).value?.toString().trim() : '';
        const centroTrabajo =
          centroTrabajoCol > 0 ? row.getCell(centroTrabajoCol).value?.toString().trim() : '';
        const municipioNombre =
          municipioCol > 0 ? row.getCell(municipioCol).value?.toString().trim() : '';
        const misionInterna = misionCol > 0 ? row.getCell(misionCol).value?.toString().trim() : '';

        // Separar nombre y apellidos
        const { nombre, apellidos } = this.separarNombreApellidos(nombreCompleto);

        if (!nombre || !apellidos) {
          resultado.errores.push({
            fila: rowNum,
            hoja: hojaNombre,
            error: 'No se pudo separar nombre y apellidos',
            datos: { nombreCompleto },
          });
          continue;
        }

        // Buscar o crear especialidad
        let especialidad = null;
        if (especialidadNombre) {
          especialidad = especialidades.find(
            (e) =>
              e.nombre.toLowerCase().includes(especialidadNombre.toLowerCase()) ||
              especialidadNombre.toLowerCase().includes(e.nombre.toLowerCase()),
          );

          if (!especialidad) {
            // Crear especialidad nueva
            const codigo = 'ESP_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            especialidad = await this.prisma.especialidad.create({
              data: {
                codigo: codigo.substring(0, 20),
                nombre: especialidadNombre,
                descripcion: `Importado desde ${hojaNombre}`,
              },
            });
            especialidades.push(especialidad);
          }
        }

        // Buscar o crear cargo
        let cargo = null;
        if (cargoNombre) {
          cargo = cargos.find(
            (c) =>
              c.nombre.toLowerCase().includes(cargoNombre.toLowerCase()) ||
              cargoNombre.toLowerCase().includes(c.nombre.toLowerCase()),
          );

          if (!cargo) {
            // Crear cargo nuevo
            const codigo = 'CAR_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            cargo = await this.prisma.cargo.create({
              data: {
                codigo: codigo.substring(0, 20),
                nombre: cargoNombre,
                descripcion: `Importado desde ${hojaNombre}`,
              },
            });
            cargos.push(cargo);
          }
        }

        // Buscar municipio
        let municipio = null;
        if (municipioNombre) {
          municipio = municipios.find(
            (m) =>
              m.nombre.toLowerCase().includes(municipioNombre.toLowerCase()) ||
              municipioNombre.toLowerCase().includes(m.nombre.toLowerCase()),
          );
        }

        // Determinar estado potencial
        const estadoPotencial: EstadoPotencial =
          misionInterna && (misionInterna.toUpperCase().includes('SI') || misionInterna === 'X')
            ? EstadoPotencial.EN_PROCESO
            : EstadoPotencial.ACTIVO;

        // Buscar profesor por CI o nombre/apellidos
        let profesorExistente = null;

        if (ci && ci.length >= 11) {
          profesorExistente = await this.prisma.profesor.findUnique({
            where: { ci },
          });
        }

        if (!profesorExistente) {
          profesorExistente = await this.prisma.profesor.findFirst({
            where: {
              AND: [
                { nombre: { contains: nombre, mode: 'insensitive' } },
                { apellidos: { contains: apellidos, mode: 'insensitive' } },
              ],
            },
          });
        }

        if (profesorExistente) {
          // Actualizar profesor existente
          await this.prisma.profesor.update({
            where: { id: profesorExistente.id },
            data: {
              ci: ci || profesorExistente.ci,
              cargoId: cargo?.id || profesorExistente.cargoId,
              especialidadId: especialidad?.id || profesorExistente.especialidadId,
              municipioId: municipio?.id || profesorExistente.municipioId,
              estadoPotencial:
                estadoPotencial !== EstadoPotencial.ACTIVO
                  ? estadoPotencial
                  : profesorExistente.estadoPotencial,
              observaciones: centroTrabajo
                ? `Centro: ${centroTrabajo}`
                : profesorExistente.observaciones,
              updatedBy: userId,
            },
          });
          resultado.actualizados++;
        } else {
          // Crear nuevo profesor
          await this.prisma.profesor.create({
            data: {
              ci: ci || `TEMP_${Date.now()}_${rowNum}`,
              nombre,
              apellidos,
              edad: null,
              sexo: null,
              estadoCivil: null,
              nivelIngles: NivelIngles.BASICO,
              estadoPotencial,
              cargoId: cargo?.id || null,
              especialidadId: especialidad?.id || null,
              municipioId: municipio?.id || null,
              observaciones: centroTrabajo
                ? `Centro: ${centroTrabajo}`
                : `Importado desde ${hojaNombre}`,
              createdBy: userId,
            },
          });
          resultado.creados++;
        }
      } catch (error: any) {
        resultado.errores.push({
          fila: rowNum,
          hoja: hojaNombre,
          error: error.message || 'Error desconocido',
          datos: { nombreCompleto },
        });
      }
    }

    console.log(
      `✅ Hoja ${hojaNombre}: ${resultado.creados} creados, ${resultado.actualizados} actualizados, ${resultado.errores.length} errores`,
    );

    return resultado;
  }
}

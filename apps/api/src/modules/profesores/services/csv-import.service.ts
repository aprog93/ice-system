import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { Sexo, EstadoCivil, NivelIngles, TipoPasaporte, EstadoContrato } from '@prisma/client';
import { parse } from 'csv-parse/sync';

interface CsvRow {
  Id: string;
  'NOMBRE Y APELLIDOS': string;
  'C IDENTIDAD': string;
  SEXO: string;
  EDAD: string;
  PIEL: string;
  'TIPO PASAPORTE': string;
  'NUM PASAPORTE': string;
  'FECHA DE VENCIMIENTO': string;
  'TELEFONO PART': string;
  'DIRECCION PART': string;
  PROVINCIA: string;
  MUNICIPIO: string;
  REPARTO: string;
  'ESTADO CIVIL': string;
  'CANT HIJOS': string;
  PADRE: string;
  MADRE: string;
  'FAMILIAR AVISO': string;
  CONYUGE: string;
  'CENTRO TRABAJO': string;
  'DIRECCION CENTRO': string;
  DPE: string;
  OTROS: string;
  'CARGO SALIR': string;
  ESPECIALIDAD: string;
  'TELEF TRABAJO': string;
  CUADRO: string;
  DR: string;
  MSC: string;
  TITULAR: string;
  AUXILIAR: string;
  ASISTENTE: string;
  IDIOMA: string;
  PCC: string;
  UJC: string;
  'FECHA CONTRATO': string;
  'NUMERO CONTRATO': string;
  'SALE POR': string;
  'PAIS VIAJA': string;
  ESTADO: string;
  INSTITUCION: string;
  LOCALIZACION: string;
  'FUNCION A REALIZAR': string;
  'FECHA SALIDA': string;
  'FECHA REGRESO': string;
  'FECHA REAL REGRESO': string;
  'CAUSA CIERRE': string;
  'INGRESO SPT': string;
  'INGRESO POR APORTE': string;
  'TOTAL INGRESADO': string;
  VIATICO: string;
  'ACTIVIDAD ESPECIFICA': string;
  'FECHA CIERRE CONT': string;
  CIERRA: string;
  'OBSERVACIONES CIERRE': string;
  'NO SUPLEMENTO': string;
  'FECHA DESDE': string;
  'FECHA HASTA': string;
  'FECHA PRORROGA': string;
  'OBSERVACIONES PRORROGA': string;
  'OBSERVACIONES CONTRATO': string;
  'ENTRADA VACACIONES': string;
  VISAS: string;
  INFORME: string;
  EVALUACION: string;
  SALARIO: string;
}

@Injectable()
export class CsvImportService {
  constructor(private prisma: PrismaService) {}

  // Mapeo de códigos de provincia del CSV a códigos de la BD
  private provinciaCodeMap: Record<string, string> = {
    PR: '01', // PINAR DEL RIO
    ART: '02', // ARTEMISA
    LH: '03', // LA HABANA
    MY: '04', // MAYABEQUE
    MTZ: '05', // MATANZAS
    CFG: '06', // CIENFUEGOS
    VC: '07', // VILLA CLARA
    SS: '08', // SANCTI SPIRITUS
    CA: '09', // CIEGO DE AVILA
    CMG: '10', // CAMAGUEY
    LT: '11', // LAS TUNAS
    HOL: '12', // HOLGUIN
    GRM: '13', // GRANMA
    SC: '14', // SANTIAGO DE CUBA
    GTN: '15', // GUANTANAMO
    IJ: '16', // ISLA DE LA JUVENTUD
  };

  // Mapeo de tipos de pasaporte del CSV al enum
  private mapTipoPasaporte(tipo: string): TipoPasaporte {
    const tipoUpper = tipo?.toUpperCase().trim();
    if (tipoUpper === 'OFI') return TipoPasaporte.OFICIAL;
    if (tipoUpper === 'ORD') return TipoPasaporte.ORDINARIO;
    if (tipoUpper === 'DIP') return TipoPasaporte.DIPLOMATICO;
    // Inferir del número de pasaporte
    return TipoPasaporte.OFICIAL; // Por defecto
  }

  // Mapeo de sexo del CSV al enum
  private mapSexo(sexo: string): Sexo | undefined {
    const sexoUpper = sexo?.toUpperCase().trim();
    if (sexoUpper === 'M') return Sexo.MASCULINO;
    if (sexoUpper === 'F') return Sexo.FEMENINO;
    return undefined;
  }

  // Mapeo de estado civil del CSV al enum
  private mapEstadoCivil(estado: string): EstadoCivil | undefined {
    const estadoUpper = estado?.toUpperCase().trim();
    if (estadoUpper?.includes('SOLTER')) return EstadoCivil.SOLTERO;
    if (estadoUpper?.includes('CASAD')) return EstadoCivil.CASADO;
    if (estadoUpper?.includes('DIVORCIAD')) return EstadoCivil.DIVORCIADO;
    if (estadoUpper?.includes('VIUD')) return EstadoCivil.VIUDO;
    return undefined;
  }

  // Mapeo de nivel de inglés
  private mapNivelIngles(idioma: string): NivelIngles | undefined {
    const idiomaUpper = idioma?.toUpperCase().trim();
    if (idiomaUpper?.includes('INGLES') || idiomaUpper?.includes('INGLÉS'))
      return NivelIngles.BASICO;
    if (idiomaUpper?.includes('PORTUGUES') || idiomaUpper?.includes('PORTUGUÉS'))
      return NivelIngles.BASICO;
    if (idiomaUpper?.includes('FRANCES') || idiomaUpper?.includes('FRANCÉS'))
      return NivelIngles.BASICO;
    return undefined;
  }

  // Separar nombre y apellidos
  private separarNombreApellidos(nombreCompleto: string): { nombre: string; apellidos: string } {
    const partes = nombreCompleto?.trim().split(/\s+/) || ['', ''];
    if (partes.length === 1) {
      return { nombre: partes[0], apellidos: '' };
    }
    // Últimas 2 palabras son apellidos, el resto es nombre
    const apellidos = partes.slice(-2).join(' ');
    const nombre = partes.slice(0, -2).join(' ');
    return { nombre: nombre || partes[0], apellidos };
  }

  // Parsear fecha del CSV (formato ISO o varios formatos)
  private parseFecha(fechaStr: string): Date | undefined {
    if (!fechaStr || fechaStr.trim() === '') return undefined;

    // Intentar parsear como ISO
    const fecha = new Date(fechaStr);
    if (!isNaN(fecha.getTime())) {
      return fecha;
    }

    // Intentar formato DD/MM/YYYY
    const parts = fechaStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      const fecha2 = new Date(year, month, day);
      if (!isNaN(fecha2.getTime())) {
        return fecha2;
      }
    }

    return undefined;
  }

  async importarCsv(buffer: Buffer, userId: string) {
    const resultados = {
      profesoresCreados: 0,
      profesoresActualizados: 0,
      pasaportesCreados: 0,
      contratosCreados: 0,
      prorrogasCreadas: 0,
      errores: [] as { fila: number; error: string }[],
    };

    try {
      // Parsear CSV
      const records = parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as CsvRow[];

      console.log(`📄 CSV parseado: ${records.length} registros encontrados`);

      // Obtener nomencladores
      const [provincias, paises, cargosDb, especialidadesDb] = await Promise.all([
        this.prisma.provincia.findMany(),
        this.prisma.pais.findMany(),
        this.prisma.cargo.findMany(),
        this.prisma.especialidad.findMany(),
      ]);

      // Crear mapas para búsqueda rápida
      const provinciaMap = new Map(provincias.map((p) => [p.codigo, p]));
      const paisMap = new Map(paises.map((p) => [p.nombreEs.toUpperCase(), p]));

      let rowIndex = 2; // Empezar en 2 (después del header)

      for (const row of records) {
        try {
          // Validar datos mínimos
          const ci = row['C IDENTIDAD']?.trim();
          const nombreCompleto = row['NOMBRE Y APELLIDOS']?.trim();

          if (!ci || !nombreCompleto) {
            resultados.errores.push({ fila: rowIndex, error: 'CI o nombre faltante' });
            rowIndex++;
            continue;
          }

          // Separar nombre y apellidos
          const { nombre, apellidos } = this.separarNombreApellidos(nombreCompleto);

          // Buscar provincia
          const provinciaCode = this.provinciaCodeMap[row.PROVINCIA?.toUpperCase().trim()];
          const provincia = provinciaCode ? provinciaMap.get(provinciaCode) : null;

          // Buscar país del contrato
          const paisNombre = row['PAIS VIAJA']?.trim();
          const pais = paisNombre
            ? Array.from(paisMap.values()).find(
                (p) =>
                  p.nombreEs.toUpperCase().includes(paisNombre.toUpperCase()) ||
                  paisNombre.toUpperCase().includes(p.nombreEs.toUpperCase().split(' ')[0]),
              )
            : null;

          // Buscar o crear cargo
          let cargo = null;
          const cargoNombre = row['CARGO SALIR']?.trim();
          if (cargoNombre) {
            cargo = await this.prisma.cargo.findFirst({
              where: { nombre: { contains: cargoNombre, mode: 'insensitive' } },
            });
          }

          // Buscar o crear especialidad
          let especialidad = null;
          const espNombre = row.ESPECIALIDAD?.trim();
          if (espNombre) {
            especialidad = await this.prisma.especialidad.findFirst({
              where: { nombre: { contains: espNombre, mode: 'insensitive' } },
            });
          }

          // Buscar profesor existente
          const profesorExistente = await this.prisma.profesor.findUnique({
            where: { ci },
          });

          let profesorId: string;

          if (profesorExistente) {
            // Actualizar profesor
            await this.prisma.profesor.update({
              where: { id: profesorExistente.id },
              data: {
                nombre,
                apellidos,
                edad: row.EDAD ? parseInt(row.EDAD) : null,
                sexo: this.mapSexo(row.SEXO),
                colorPiel: row.PIEL || null,
                direccion: row['DIRECCION PART'] || null,
                provinciaId: provincia?.id || null,
                estadoCivil: this.mapEstadoCivil(row['ESTADO CIVIL']),
                cantidadHijos: row['CANT HIJOS'] ? parseInt(row['CANT HIJOS']) : 0,
                telefonoMovil: row['TELEFONO PART'] || null,
                nivelIngles: this.mapNivelIngles(row.IDIOMA),
                cargoId: cargo?.id || null,
                especialidadId: especialidad?.id || null,
                updatedBy: userId,
              },
            });
            profesorId = profesorExistente.id;
            resultados.profesoresActualizados++;
          } else {
            // Crear profesor
            const nuevoProfesor = await this.prisma.profesor.create({
              data: {
                ci,
                nombre,
                apellidos,
                edad: row.EDAD ? parseInt(row.EDAD) : null,
                sexo: this.mapSexo(row.SEXO),
                colorPiel: row.PIEL || null,
                direccion: row['DIRECCION PART'] || null,
                provinciaId: provincia?.id || null,
                estadoCivil: this.mapEstadoCivil(row['ESTADO CIVIL']),
                cantidadHijos: row['CANT HIJOS'] ? parseInt(row['CANT HIJOS']) : 0,
                telefonoMovil: row['TELEFONO PART'] || null,
                nivelIngles: this.mapNivelIngles(row.IDIOMA),
                cargoId: cargo?.id || null,
                especialidadId: especialidad?.id || null,
                createdBy: userId,
              },
            });
            profesorId = nuevoProfesor.id;
            resultados.profesoresCreados++;
          }

          // Crear pasaporte si existe número
          const numPasaporte = row['NUM PASAPORTE']?.trim();
          if (numPasaporte) {
            const pasaporteExistente = await this.prisma.pasaporte.findUnique({
              where: { numero: numPasaporte },
            });

            if (!pasaporteExistente) {
              await this.prisma.pasaporte.create({
                data: {
                  profesorId,
                  numero: numPasaporte,
                  tipo: this.mapTipoPasaporte(row['TIPO PASAPORTE']),
                  fechaVencimiento: this.parseFecha(row['FECHA DE VENCIMIENTO']) || new Date(),
                  observaciones: 'Importado desde CSV',
                },
              });
              resultados.pasaportesCreados++;
            }
          }

          // Crear contrato si hay datos
          const fechaContrato = this.parseFecha(row['FECHA CONTRATO']);
          const numContrato = row['NUMERO CONTRATO']?.trim();

          if (fechaContrato && numContrato && pais) {
            const fechaInicio = this.parseFecha(row['FECHA SALIDA']) || fechaContrato;
            const fechaFin = this.parseFecha(row['FECHA REGRESO']) || fechaContrato;
            const ano = fechaContrato.getFullYear();
            const numeroConsecutivo = parseInt(numContrato) || 1;

            // Verificar si ya existe el contrato
            const contratoExistente = await this.prisma.contrato.findUnique({
              where: {
                numeroConsecutivo_ano: {
                  numeroConsecutivo,
                  ano,
                },
              },
            });

            if (!contratoExistente) {
              const nuevoContrato = await this.prisma.contrato.create({
                data: {
                  numeroConsecutivo,
                  ano,
                  profesorId,
                  paisId: pais.id,
                  fechaInicio,
                  fechaFin,
                  funcion: row['FUNCION A REALIZAR'] || 'No especificada',
                  centroTrabajo: row['CENTRO TRABAJO'] || 'No especificado',
                  estado: EstadoContrato.ACTIVO,
                  observaciones: row['OBSERVACIONES CONTRATO'] || null,
                  createdBy: userId,
                },
              });
              resultados.contratosCreados++;

              // Crear prórroga si existe
              const fechaDesde = this.parseFecha(row['FECHA DESDE']);
              const fechaHasta = this.parseFecha(row['FECHA HASTA']);

              if (fechaDesde && fechaHasta) {
                await this.prisma.prorroga.create({
                  data: {
                    contratoId: nuevoContrato.id,
                    numeroProrroga: row['NO SUPLEMENTO'] ? parseInt(row['NO SUPLEMENTO']) : 1,
                    fechaDesde,
                    fechaHasta,
                    motivo: 'Importado desde CSV',
                    observaciones: row['OBSERVACIONES PRORROGA'] || null,
                    createdBy: userId,
                  },
                });
                resultados.prorrogasCreadas++;
              }
            }
          }
        } catch (error: any) {
          resultados.errores.push({
            fila: rowIndex,
            error: error.message || 'Error desconocido',
          });
        }

        rowIndex++;
      }

      return resultados;
    } catch (error: any) {
      throw new BadRequestException(`Error al procesar CSV: ${error.message}`);
    }
  }
}

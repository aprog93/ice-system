import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { PrismaService } from '@/database/prisma.service';
import { GenerarSolicitudDto } from '../dto/pasaporte.dto';
import { PdfGeneratorService } from './pdf-generator.service';

@Injectable()
export class PdfService {
  constructor(
    private prisma: PrismaService,
    private pdfGenerator: PdfGeneratorService,
  ) {}

  // ============================================
  // SOLICITUD DE PASAPORTE
  // ============================================
  async generarSolicitudPasaporte(dto: GenerarSolicitudDto): Promise<Buffer> {
    const { pasaporteId, firmante = 'Director General', cargoFirmante = 'Director' } = dto;

    const pasaporte = await this.prisma.pasaporte.findUnique({
      where: { id: pasaporteId },
      include: {
        profesor: {
          include: {
            provincia: true,
            municipio: true,
          },
        },
      },
    });

    if (!pasaporte) {
      throw new Error('Pasaporte no encontrado');
    }

    const { profesor } = pasaporte;
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;
    const margin = 50;

    // Header
    page.drawText('SOLICITUD DE PASAPORTE', {
      x: margin,
      y,
      size: 18,
      font: helveticaBold,
    });

    y -= 40;
    page.drawText(`La Habana, ${new Date().toLocaleDateString('es-CU')}`, {
      x: width - 200,
      y,
      size: 10,
      font: helveticaFont,
    });

    y -= 50;

    // DATOS DEL SOLICITANTE
    page.drawText('DATOS DEL SOLICITANTE', {
      x: margin,
      y,
      size: 12,
      font: helveticaBold,
    });

    y -= 25;

    const drawField = (label: string, value: string) => {
      page.drawText(`${label}:`, { x: margin, y, size: 10, font: helveticaBold });
      page.drawText(value || 'N/A', { x: margin + 180, y, size: 10, font: helveticaFont });
      y -= 18;
    };

    drawField('Nombre completo', `${profesor.nombre} ${profesor.apellidos}`);
    drawField('Carnet de Identidad', profesor.ci);
    drawField('Edad', `${profesor.edad} años`);
    drawField('Sexo', profesor.sexo === 'MASCULINO' ? 'M' : 'F');
    drawField('Estado Civil', profesor.estadoCivil.replace('_', ' '));
    drawField('Color de ojos', profesor.colorOjos || 'N/A');
    drawField('Color de pelo', profesor.colorPelo || 'N/A');
    drawField('Estatura', profesor.estatura ? `${profesor.estatura} m` : 'N/A');
    drawField('Señas particulares', profesor.senasParticulares || 'N/A');
    drawField('Dirección', profesor.direccion || 'No especificada');
    drawField('Provincia', profesor.provincia?.nombre || 'N/A');
    drawField('Municipio', profesor.municipio?.nombre || 'N/A');
    drawField('Teléfono', profesor.telefonoMovil || profesor.telefonoFijo || 'N/A');
    drawField('Email', profesor.email || 'N/A');

    y -= 20;

    // DATOS DEL PASAPORTE
    page.drawText('DATOS DEL PASAPORTE', {
      x: margin,
      y,
      size: 12,
      font: helveticaBold,
    });

    y -= 25;

    drawField('Número', pasaporte.numero);
    drawField('Tipo', pasaporte.tipo);
    drawField('Fecha de expedición', pasaporte.fechaExpedicion.toLocaleDateString('es-CU'));
    drawField('Fecha de vencimiento', pasaporte.fechaVencimiento.toLocaleDateString('es-CU'));
    drawField('Lugar de expedición', pasaporte.lugarExpedicion || 'N/A');

    y -= 30;

    // MOTIVO
    page.drawText('MOTIVO DE LA SOLICITUD:', {
      x: margin,
      y,
      size: 11,
      font: helveticaBold,
    });

    y -= 25;

    page.drawRectangle({
      x: margin,
      y: y - 80,
      width: width - margin * 2,
      height: 80,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    page.drawText('Cooperación Internacional de Educadores', {
      x: margin + 10,
      y: y - 25,
      size: 10,
      font: helveticaFont,
    });

    y -= 120;

    // FIRMA
    page.drawText('FIRMA DEL SOLICITANTE:', {
      x: margin,
      y,
      size: 11,
      font: helveticaBold,
    });

    page.drawLine({
      start: { x: margin, y: y - 40 },
      end: { x: margin + 200, y: y - 40 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    y -= 80;

    // AUTORIZACIÓN
    page.drawText('AUTORIZACIÓN', {
      x: margin,
      y,
      size: 12,
      font: helveticaBold,
    });

    y -= 30;

    page.drawText(
      'Se autoriza la expedición del pasaporte solicitado para fines de cooperación internacional.',
      { x: margin, y, size: 10, font: helveticaFont, maxWidth: width - margin * 2 },
    );

    y -= 60;

    page.drawLine({
      start: { x: margin, y: y - 40 },
      end: { x: margin + 200, y: y - 40 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    page.drawText(firmante, { x: margin, y: y - 55, size: 10, font: helveticaFont });
    page.drawText(cargoFirmante, {
      x: margin,
      y: y - 70,
      size: 9,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Footer
    page.drawText('Sistema ICE - Cooperación Internacional de Educadores', {
      x: margin,
      y: 30,
      size: 8,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  // ============================================
  // ACTA DE EXTRANJERÍA DESDE MODELO ACTA
  // Usa Puppeteer + HTML Template (formato oficial MININT)
  // ============================================
  async generarActaExtranjeriaPdf(actaId: string): Promise<Buffer> {
    const acta = await this.prisma.actaExtranjeria.findUnique({
      where: { id: actaId },
      include: {
        profesor: {
          include: {
            provincia: true,
            municipio: true,
          },
        },
        paisDestino: true,
      },
    });

    if (!acta) {
      throw new Error('Acta de extranjería no encontrada');
    }

    const { profesor, paisDestino } = acta;

    // Extraer fecha
    const fechaActa = new Date(acta.fechaActa);
    const dia = String(fechaActa.getDate()).padStart(2, '0');
    const mes = String(fechaActa.getMonth() + 1).padStart(2, '0');
    const ano = String(fechaActa.getFullYear());

    // Preparar datos para el template
    const data = {
      organismo: 'ICE',
      clave: '',
      numeroActa: `${acta.numeroActa}/${acta.ano}`,
      esSalida: true,
      esOficial: false, // Las actas de extranjería no especifican tipo de pasaporte
      esMarino: false,
      esCorriente: false,
      nombreCompleto: `${profesor.apellidos}, ${profesor.nombre}`.toUpperCase(),
      ciudadania: 'CUBA',
      dia,
      mes,
      ano,
      paisDestino: paisDestino?.nombreEs || '',
      funcion: acta.funcion?.toUpperCase() || '',
    };

    return this.pdfGenerator.generarActaExtranjeria(data);
  }

  // ============================================
  // ACTA DE EXTRANJERÍA (legacy - desde contrato)
  // ============================================
  async generarActaExtranjeria(contratoId: string): Promise<Buffer> {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id: contratoId },
      include: {
        profesor: {
          include: {
            provincia: true,
            municipio: true,
          },
        },
        pais: true,
      },
    });

    if (!contrato) {
      throw new Error('Contrato no encontrado');
    }

    const { profesor, pais } = contrato;
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;
    const margin = 50;

    // Header
    page.drawText('ACTA DE EXTRANJERÍA', {
      x: margin,
      y,
      size: 18,
      font: helveticaBold,
    });

    y -= 40;
    page.drawText(`La Habana, ${new Date().toLocaleDateString('es-CU')}`, {
      x: width - 200,
      y,
      size: 10,
      font: helveticaFont,
    });

    y -= 50;

    // ACTA
    page.drawText('ACTA', {
      x: margin,
      y,
      size: 14,
      font: helveticaBold,
    });

    y -= 30;

    const actaTexto = `Por medio de la presente se certifica que el(la) ciudadano(a) ${profesor.nombre} ${profesor.apellidos}, 
con Carnet de Identidad No. ${profesor.ci}, ha sido seleccionado(a) para cumplir misión de 
cooperación internacional en calidad de ${contrato.funcion}, en ${pais.nombreEs}, 
durante el período comprendido desde el ${contrato.fechaInicio.toLocaleDateString('es-CU')} 
hasta el ${contrato.fechaFin.toLocaleDateString('es-CU')}.

El presente documento se expide a solicitud del interesado(a) para los trámites de 
extranjería que sean necesarios.`;

    const lines = actaTexto.split('\n');
    for (const line of lines) {
      page.drawText(line.trim(), {
        x: margin,
        y,
        size: 11,
        font: helveticaFont,
        maxWidth: width - margin * 2,
      });
      y -= 20;
    }

    y -= 40;

    // DATOS DEL PROFESOR
    page.drawText('DATOS DEL PROFESOR:', {
      x: margin,
      y,
      size: 12,
      font: helveticaBold,
    });

    y -= 25;

    const drawField = (label: string, value: string) => {
      page.drawText(`${label}:`, { x: margin, y, size: 10, font: helveticaBold });
      page.drawText(value || 'N/A', { x: margin + 180, y, size: 10, font: helveticaFont });
      y -= 18;
    };

    drawField('Nombre completo', `${profesor.nombre} ${profesor.apellidos}`);
    drawField('CI', profesor.ci);
    drawField('Edad', `${profesor.edad} años`);
    drawField('Sexo', profesor.sexo);
    drawField('Estado Civil', profesor.estadoCivil.replace('_', ' '));
    drawField('Dirección', profesor.direccion || 'N/A');
    drawField('Teléfono', profesor.telefonoMovil || profesor.telefonoFijo || 'N/A');
    drawField('Email', profesor.email || 'N/A');

    y -= 40;

    // FIRMAS
    page.drawText('FIRMAS:', {
      x: margin,
      y,
      size: 12,
      font: helveticaBold,
    });

    y -= 50;

    // Firma del profesor
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + 200, y },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    page.drawText(`${profesor.nombre} ${profesor.apellidos}`, {
      x: margin,
      y: y - 15,
      size: 10,
      font: helveticaFont,
    });
    page.drawText('Profesor', {
      x: margin,
      y: y - 30,
      size: 9,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Firma del director
    page.drawLine({
      start: { x: margin + 250, y },
      end: { x: margin + 450, y },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    page.drawText('Director General', {
      x: margin + 250,
      y: y - 15,
      size: 10,
      font: helveticaFont,
    });
    page.drawText('Firma y Sello', {
      x: margin + 250,
      y: y - 30,
      size: 9,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  // ============================================
  // FICHA DEL PROFESOR
  // ============================================
  async generarFichaProfesor(profesorId: string): Promise<Buffer> {
    const profesor = await this.prisma.profesor.findUnique({
      where: { id: profesorId },
      include: {
        provincia: true,
        municipio: true,
        cargo: true,
        especialidad: true,
        categoriaDocente: true,
        pasaportes: {
          where: { activo: true },
          orderBy: { fechaVencimiento: 'desc' },
        },
        contratos: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { pais: true },
        },
      },
    });

    if (!profesor) {
      throw new Error('Profesor no encontrado');
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;
    const margin = 50;

    // Header
    page.drawText('FICHA DEL PROFESOR', {
      x: margin,
      y,
      size: 18,
      font: helveticaBold,
    });

    y -= 40;

    // DATOS PERSONALES
    page.drawText('I. DATOS PERSONALES', {
      x: margin,
      y,
      size: 14,
      font: helveticaBold,
    });

    y -= 25;

    const drawField = (label: string, value: string) => {
      page.drawText(`${label}:`, { x: margin, y, size: 10, font: helveticaBold });
      page.drawText(value || 'N/A', { x: margin + 180, y, size: 10, font: helveticaFont });
      y -= 16;
    };

    drawField('Nombre completo', `${profesor.nombre} ${profesor.apellidos}`);
    drawField('Carnet de Identidad', profesor.ci);
    drawField('Edad', `${profesor.edad} años`);
    drawField('Sexo', profesor.sexo);
    drawField('Color de piel', profesor.colorPiel || 'N/A');
    drawField('Color de ojos', profesor.colorOjos || 'N/A');
    drawField('Color de pelo', profesor.colorPelo || 'N/A');
    drawField('Estatura', profesor.estatura ? `${profesor.estatura} m` : 'N/A');
    drawField('Peso', profesor.peso ? `${profesor.peso} kg` : 'N/A');
    drawField('Señas particulares', profesor.senasParticulares || 'N/A');
    drawField('Estado Civil', profesor.estadoCivil.replace('_', ' '));
    drawField('Cantidad de hijos', profesor.cantidadHijos.toString());

    y -= 10;

    // DATOS DE CONTACTO
    page.drawText('II. DATOS DE CONTACTO', {
      x: margin,
      y,
      size: 14,
      font: helveticaBold,
    });

    y -= 25;

    drawField('Dirección', profesor.direccion || 'N/A');
    drawField('Provincia', profesor.provincia?.nombre || 'N/A');
    drawField('Municipio', profesor.municipio?.nombre || 'N/A');
    drawField('Teléfono fijo', profesor.telefonoFijo || 'N/A');
    drawField('Teléfono móvil', profesor.telefonoMovil || 'N/A');
    drawField('Email', profesor.email || 'N/A');

    y -= 10;

    // DATOS LABORALES
    page.drawText('III. DATOS LABORALES', {
      x: margin,
      y,
      size: 14,
      font: helveticaBold,
    });

    y -= 25;

    drawField('Cargo', profesor.cargo?.nombre || 'N/A');
    drawField('Especialidad', profesor.especialidad?.nombre || 'N/A');
    drawField('Categoría docente', profesor.categoriaDocente?.nombre || 'N/A');
    drawField('Años de experiencia', profesor.anosExperiencia.toString());
    drawField('Nivel de inglés', profesor.nivelIngles);

    y -= 10;

    // DATOS ACADÉMICOS
    page.drawText('IV. DATOS ACADÉMICOS', {
      x: margin,
      y,
      size: 14,
      font: helveticaBold,
    });

    y -= 25;

    drawField('Año de graduación', profesor.anoGraduado?.toString() || 'N/A');
    drawField('Centro de graduación', profesor.centroGraduacion || 'N/A');
    drawField('Nota promedio', profesor.notaPromedio?.toString() || 'N/A');

    y -= 10;

    // PASAPORTES
    page.drawText('V. PASAPORTES', {
      x: margin,
      y,
      size: 14,
      font: helveticaBold,
    });

    y -= 25;

    if (profesor.pasaportes.length > 0) {
      for (const pasaporte of profesor.pasaportes) {
        page.drawText(
          `${pasaporte.numero} - ${pasaporte.tipo} - Vence: ${pasaporte.fechaVencimiento.toLocaleDateString('es-CU')}`,
          { x: margin, y, size: 10, font: helveticaFont },
        );
        y -= 16;
      }
    } else {
      page.drawText('No tiene pasaportes registrados', {
        x: margin,
        y,
        size: 10,
        font: helveticaFont,
      });
      y -= 16;
    }

    y -= 10;

    // CONTRATOS
    page.drawText('VI. CONTRATOS RECIENTES', {
      x: margin,
      y,
      size: 14,
      font: helveticaBold,
    });

    y -= 25;

    if (profesor.contratos.length > 0) {
      for (const contrato of profesor.contratos) {
        page.drawText(
          `${contrato.numeroConsecutivo}/${contrato.ano} - ${contrato.pais?.nombreEs} - ${contrato.funcion} - ${contrato.estado}`,
          { x: margin, y, size: 10, font: helveticaFont },
        );
        y -= 16;
      }
    } else {
      page.drawText('No tiene contratos registrados', {
        x: margin,
        y,
        size: 10,
        font: helveticaFont,
      });
      y -= 16;
    }

    // Footer
    page.drawText('Sistema ICE - Cooperación Internacional de Educadores', {
      x: margin,
      y: 30,
      size: 8,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  // ============================================
  // CIERRE DE CONTRATO
  // ============================================
  async generarCierreContrato(contratoId: string): Promise<Buffer> {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id: contratoId },
      include: {
        profesor: true,
        pais: true,
      },
    });

    if (!contrato) {
      throw new Error('Contrato no encontrado');
    }

    const { profesor, pais } = contrato;
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;
    const margin = 50;

    // Header
    page.drawText('CIERRE DE CONTRATO', {
      x: margin,
      y,
      size: 18,
      font: helveticaBold,
    });

    y -= 40;
    page.drawText(`La Habana, ${new Date().toLocaleDateString('es-CU')}`, {
      x: width - 200,
      y,
      size: 10,
      font: helveticaFont,
    });

    y -= 50;

    // DATOS DEL CONTRATO
    page.drawText('DATOS DEL CONTRATO', {
      x: margin,
      y,
      size: 14,
      font: helveticaBold,
    });

    y -= 25;

    const drawField = (label: string, value: string) => {
      page.drawText(`${label}:`, { x: margin, y, size: 10, font: helveticaBold });
      page.drawText(value || 'N/A', { x: margin + 180, y, size: 10, font: helveticaFont });
      y -= 18;
    };

    drawField('Número de contrato', `${contrato.numeroConsecutivo}/${contrato.ano}`);
    drawField('Profesor', `${profesor.nombre} ${profesor.apellidos}`);
    drawField('CI', profesor.ci);
    drawField('País', pais.nombreEs);
    drawField('Función', contrato.funcion);
    drawField('Centro de trabajo', contrato.centroTrabajo);
    drawField('Fecha de inicio', contrato.fechaInicio.toLocaleDateString('es-CU'));
    drawField('Fecha de fin original', contrato.fechaFin.toLocaleDateString('es-CU'));
    drawField('Fecha de cierre', contrato.fechaCierre?.toLocaleDateString('es-CU') || 'N/A');
    drawField('Motivo de cierre', contrato.motivoCierre || 'N/A');

    y -= 30;

    // ACTA DE CIERRE
    page.drawText('ACTA DE CIERRE', {
      x: margin,
      y,
      size: 14,
      font: helveticaBold,
    });

    y -= 30;

    const actaTexto = `Por medio de la presente se certifica que el contrato de trabajo suscrito 
entre el Ministerio de Educación y el(la) ciudadano(a) ${profesor.nombre} ${profesor.apellidos}, 
para cumplir misión de cooperación internacional en ${pais.nombreEs}, ha sido 
CERRADO de conformidad con las normas vigentes.

El cierre se realizó por el siguiente motivo: ${contrato.motivoCierre || 'No especificado'}.

Se deja constancia de que el(la) profesor(a) cumplió satisfactoriamente con las 
obligaciones contraídas durante el período de la misión.`;

    const lines = actaTexto.split('\n');
    for (const line of lines) {
      page.drawText(line.trim(), {
        x: margin,
        y,
        size: 11,
        font: helveticaFont,
        maxWidth: width - margin * 2,
      });
      y -= 20;
    }

    y -= 40;

    // FIRMAS
    page.drawText('FIRMAS:', {
      x: margin,
      y,
      size: 12,
      font: helveticaBold,
    });

    y -= 50;

    // Firma del profesor
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + 200, y },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    page.drawText(`${profesor.nombre} ${profesor.apellidos}`, {
      x: margin,
      y: y - 15,
      size: 10,
      font: helveticaFont,
    });
    page.drawText('Profesor', {
      x: margin,
      y: y - 30,
      size: 9,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Firma del director
    page.drawLine({
      start: { x: margin + 250, y },
      end: { x: margin + 450, y },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    page.drawText('Director General', {
      x: margin + 250,
      y: y - 15,
      size: 10,
      font: helveticaFont,
    });
    page.drawText('Firma y Sello', {
      x: margin + 250,
      y: y - 30,
      size: 9,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  // ============================================
  // SUPLEMENTO DE PRÓRROGA
  // ============================================
  async generarSuplementoProrroga(prorrogaId: string): Promise<Buffer> {
    const prorroga = await this.prisma.prorroga.findUnique({
      where: { id: prorrogaId },
      include: {
        contrato: {
          include: {
            profesor: true,
            pais: true,
          },
        },
      },
    });

    if (!prorroga) {
      throw new Error('Prórroga no encontrada');
    }

    const { contrato, profesor, pais } = {
      ...prorroga,
      profesor: prorroga.contrato.profesor,
      pais: prorroga.contrato.pais,
    };

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;
    const margin = 50;

    // Header
    page.drawText('SUPLEMENTO DE PRÓRROGA', {
      x: margin,
      y,
      size: 18,
      font: helveticaBold,
    });

    y -= 40;
    page.drawText(`La Habana, ${new Date().toLocaleDateString('es-CU')}`, {
      x: width - 200,
      y,
      size: 10,
      font: helveticaFont,
    });

    y -= 50;

    // DATOS DEL CONTRATO ORIGINAL
    page.drawText('DATOS DEL CONTRATO ORIGINAL', {
      x: margin,
      y,
      size: 14,
      font: helveticaBold,
    });

    y -= 25;

    const drawField = (label: string, value: string) => {
      page.drawText(`${label}:`, { x: margin, y, size: 10, font: helveticaBold });
      page.drawText(value || 'N/A', { x: margin + 180, y, size: 10, font: helveticaFont });
      y -= 18;
    };

    drawField('Número de contrato', `${contrato.numeroConsecutivo}/${contrato.ano}`);
    drawField('Profesor', `${profesor.nombre} ${profesor.apellidos}`);
    drawField('CI', profesor.ci);
    drawField('País', pais.nombreEs);
    drawField('Función', contrato.funcion);
    drawField('Centro de trabajo', contrato.centroTrabajo);

    y -= 20;

    // DATOS DE LA PRÓRROGA
    page.drawText('DATOS DE LA PRÓRROGA', {
      x: margin,
      y,
      size: 14,
      font: helveticaBold,
    });

    y -= 25;

    drawField('Número de prórroga', prorroga.numeroProrroga.toString());
    drawField('Fecha de inicio', prorroga.fechaDesde.toLocaleDateString('es-CU'));
    drawField('Fecha de fin', prorroga.fechaHasta.toLocaleDateString('es-CU'));
    drawField('Motivo', prorroga.motivo);

    y -= 30;

    // ACTA DE PRÓRROGA
    page.drawText('ACTA DE PRÓRROGA', {
      x: margin,
      y,
      size: 14,
      font: helveticaBold,
    });

    y -= 30;

    const actaTexto = `Por medio de la presente se certifica que se ha autorizado la PRÓRROGA 
No. ${prorroga.numeroProrroga} del contrato de trabajo suscrito entre el Ministerio 
de Educación y el(la) ciudadano(a) ${profesor.nombre} ${profesor.apellidos}, para 
cumplir misión de cooperación internacional en ${pais.nombreEs}.

La prórroga comprende el período desde el ${prorroga.fechaDesde.toLocaleDateString('es-CU')} 
hasta el ${prorroga.fechaHasta.toLocaleDateString('es-CU')}.

Motivo de la prórroga: ${prorroga.motivo}.

El(la) profesor(a) continuará desempeñando las funciones de ${contrato.funcion} 
en el centro de trabajo ${contrato.centroTrabajo}.`;

    const lines = actaTexto.split('\n');
    for (const line of lines) {
      page.drawText(line.trim(), {
        x: margin,
        y,
        size: 11,
        font: helveticaFont,
        maxWidth: width - margin * 2,
      });
      y -= 20;
    }

    y -= 40;

    // FIRMAS
    page.drawText('FIRMAS:', {
      x: margin,
      y,
      size: 12,
      font: helveticaBold,
    });

    y -= 50;

    // Firma del profesor
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + 200, y },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    page.drawText(`${profesor.nombre} ${profesor.apellidos}`, {
      x: margin,
      y: y - 15,
      size: 10,
      font: helveticaFont,
    });
    page.drawText('Profesor', {
      x: margin,
      y: y - 30,
      size: 9,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Firma del director
    page.drawLine({
      start: { x: margin + 250, y },
      end: { x: margin + 450, y },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    page.drawText('Director General', {
      x: margin + 250,
      y: y - 15,
      size: 10,
      font: helveticaFont,
    });
    page.drawText('Firma y Sello', {
      x: margin + 250,
      y: y - 30,
      size: 9,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  // ============================================
  // FORMULARIO X-22 A ICE - SOLICITUD DE PASAPORTE
  // Formato exacto según docs/1.png y docs/2.png
  // ============================================
  async generarFormularioSolicitudPasaporteX22(pasaporteId: string): Promise<Buffer> {
    const pasaporte = await this.prisma.pasaporte.findUnique({
      where: { id: pasaporteId },
      include: {
        profesor: {
          include: {
            provincia: true,
            municipio: true,
            paisNacimiento: true,
            cargo: true,
            especialidad: true,
          },
        },
      },
    });

    if (!pasaporte) {
      throw new Error('Pasaporte no encontrado');
    }

    const profesor = pasaporte.profesor;
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Dimensiones A4
    const PAGE_WIDTH = 595.28;
    const PAGE_HEIGHT = 841.89;
    const MARGIN = 40;
    const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

    // Helper para calcular posición Y (de arriba hacia abajo)
    let currentY = PAGE_HEIGHT - MARGIN;

    // ========== PÁGINA 1 ==========
    const page1 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    // Función para dibujar caja con borde
    const drawBox = (x: number, y: number, w: number, h: number, page = page1) => {
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        borderWidth: 1,
        borderColor: rgb(0, 0, 0),
      });
    };

    // Función para dibujar texto centrado
    const drawTextCentered = (
      text: string,
      x: number,
      y: number,
      w: number,
      size: number,
      bold = false,
      page = page1,
    ) => {
      const f = bold ? fontBold : font;
      const textWidth = f.widthOfTextAtSize(text || '', size);
      const startX = x + (w - textWidth) / 2;
      // Ajustar Y para que el texto quede centrado verticalmente
      const startY = y + 3;
      page.drawText(text || '', { x: startX, y: startY, size, font: f });
    };

    // Función para dibujar texto a la izquierda
    const drawTextLeft = (
      text: string,
      x: number,
      y: number,
      size: number,
      bold = false,
      page = page1,
    ) => {
      const f = bold ? fontBold : font;
      page.drawText(text || '', { x, y: y + 3, size, font: f });
    };

    // Función para dibujar checkbox
    const drawCheckbox = (x: number, y: number, checked: boolean, page = page1) => {
      page.drawRectangle({
        x,
        y: y + 2,
        width: 8,
        height: 8,
        borderWidth: 1,
        borderColor: rgb(0, 0, 0),
      });
      if (checked) {
        page.drawText('X', { x: x + 1.5, y: y + 3, size: 7, font: fontBold });
      }
    };

    // 1. ENCABEZADO VACÍO (para logo)
    drawBox(MARGIN, currentY - 70, CONTENT_WIDTH, 70);
    currentY -= 70;

    // 2. FECHA DE SOLICITUD
    drawBox(MARGIN, currentY - 25, CONTENT_WIDTH, 25);
    const fechaStr = new Date().toLocaleDateString('es-CU');
    drawTextCentered(fechaStr, MARGIN, currentY - 15, CONTENT_WIDTH, 10);
    drawTextCentered('Fecha de Solicitud', MARGIN, currentY - 22, CONTENT_WIDTH, 7, true);
    currentY -= 25;

    // 3. PRIMERA FILA: Apellidos y Nombres
    const col5 = CONTENT_WIDTH / 5;
    const apellidos = (profesor.apellidos || '').split(' ');
    const nombres = (profesor.nombre || '').split(' ');
    const fechaNac = profesor.fechaNacimiento
      ? new Date(profesor.fechaNacimiento).toLocaleDateString('es-CU')
      : '';

    const fila1Data = [
      { label: 'Primer Apellido', value: apellidos[0] || '' },
      { label: 'Segundo Apellido', value: apellidos[1] || '' },
      { label: 'Nombre', value: nombres[0] || '' },
      { label: 'Segundo Nombre', value: nombres[1] || '' },
      { label: 'Fecha Nacimiento', value: fechaNac },
    ];

    fila1Data.forEach((item, i) => {
      drawBox(MARGIN + i * col5, currentY - 22, col5, 22);
      drawTextCentered(item.value, MARGIN + i * col5, currentY - 10, col5, 9);
      drawTextCentered(item.label, MARGIN + i * col5, currentY - 18, col5, 6, true);
    });
    currentY -= 22;

    // 4. SEGUNDA FILA: Sexo, Tipo Pasaporte, Tipo Solicitud
    const row2Height = 45;

    // Sexo (12%)
    const sexoW = CONTENT_WIDTH * 0.12;
    drawBox(MARGIN, currentY - row2Height, sexoW, row2Height);
    drawTextCentered('Sexo', MARGIN, currentY - 8, sexoW, 7, true);
    drawTextLeft('Masculino', MARGIN + 5, currentY - 20, 7);
    drawCheckbox(MARGIN + sexoW - 15, currentY - 20, profesor.sexo === 'MASCULINO');
    drawTextLeft('Femenino', MARGIN + 5, currentY - 32, 7);
    drawCheckbox(MARGIN + sexoW - 15, currentY - 32, profesor.sexo === 'FEMENINO');

    // Tipo Pasaporte (52%)
    const tipoW = CONTENT_WIDTH * 0.52;
    drawBox(MARGIN + sexoW, currentY - row2Height, tipoW, row2Height);
    drawTextCentered('Tipo de Pasaporte', MARGIN + sexoW, currentY - 8, tipoW, 7, true);
    const tiposPas = ['Corriente', 'Servicio', 'Diplomático', 'Marino', 'Oficial'];
    tiposPas.forEach((tipo, i) => {
      const tipoLower = (pasaporte.tipo || '').toLowerCase();
      const checked =
        tipoLower === tipo.toLowerCase() ||
        (tipo === 'Corriente' && tipoLower === 'p') ||
        (tipo === 'Oficial' && tipoLower === 'o') ||
        (tipo === 'Diplomático' && tipoLower === 'd') ||
        (tipo === 'Servicio' && tipoLower === 's') ||
        (tipo === 'Marino' && tipoLower === 'm');
      drawCheckbox(MARGIN + sexoW + 15 + i * (tipoW / 5), currentY - 20, checked);
      drawTextLeft(tipo, MARGIN + sexoW + 28 + i * (tipoW / 5), currentY - 20, 6);
    });

    // Tipo Solicitud (36%)
    const solW = CONTENT_WIDTH * 0.36;
    drawBox(MARGIN + sexoW + tipoW, currentY - row2Height, solW, row2Height);
    drawTextCentered('Tipo de Solicitud', MARGIN + sexoW + tipoW, currentY - 8, solW, 7, true);
    drawCheckbox(MARGIN + sexoW + tipoW + 15, currentY - 20, true);
    drawTextLeft('Regular', MARGIN + sexoW + tipoW + 28, currentY - 20, 7);
    drawCheckbox(MARGIN + sexoW + tipoW + 15, currentY - 32, false);
    drawTextLeft('Inmediato', MARGIN + sexoW + tipoW + 28, currentY - 32, 7);
    currentY -= row2Height;

    // 5. TERCERA FILA: X-22, Convenio, Motivo
    const col3 = CONTENT_WIDTH / 3;
    drawBox(MARGIN, currentY - 20, col3, 20);
    drawTextCentered('X-22 A ICE', MARGIN, currentY - 10, col3, 8, true);
    drawBox(MARGIN + col3, currentY - 20, col3, 20);
    drawTextCentered('CONVENIO DE COLABORACIÓN', MARGIN + col3, currentY - 10, col3, 8, true);
    drawBox(MARGIN + col3 * 2, currentY - 20, col3, 20);
    drawTextCentered('MOTIVO DEL VIAJE', MARGIN + col3 * 2, currentY - 10, col3, 8, true);
    currentY -= 20;

    // 6. CUARTA FILA: Padres, Estatura, Colores
    const row4Height = 50;
    const padresW = CONTENT_WIDTH * 0.18;
    const estW = CONTENT_WIDTH * 0.12;
    const colorW = (CONTENT_WIDTH - padresW - estW) / 3;

    // Padre/Madre
    drawBox(MARGIN, currentY - row4Height, padresW, row4Height);
    drawTextCentered('Padre', MARGIN, currentY - 8, padresW / 2, 6, true);
    drawTextCentered('Madre', MARGIN + padresW / 2, currentY - 8, padresW / 2, 6, true);
    drawTextCentered(profesor.nombrePadre || '', MARGIN, currentY - 22, padresW, 7);
    drawTextCentered(profesor.nombreMadre || '', MARGIN, currentY - 35, padresW, 7);
    drawTextCentered('hijo de', MARGIN, currentY - 45, padresW, 5, true);

    // Estatura
    drawBox(MARGIN + padresW, currentY - row4Height, estW, row4Height);
    drawTextCentered('Estatura', MARGIN + padresW, currentY - 8, estW, 7, true);
    drawTextCentered(
      profesor.estatura ? `${profesor.estatura}m` : '',
      MARGIN + padresW,
      currentY - 28,
      estW,
      9,
    );

    // Color Ojos
    drawBox(MARGIN + padresW + estW, currentY - row4Height, colorW, row4Height);
    drawTextCentered('Color Ojos', MARGIN + padresW + estW, currentY - 8, colorW, 7, true);
    ['Claros', 'Negros', 'Pardos'].forEach((color, i) => {
      const checked = (profesor.colorOjos || '').toLowerCase().includes(color.toLowerCase());
      drawCheckbox(MARGIN + padresW + estW + 8, currentY - 18 - i * 12, checked);
      drawTextLeft(color, MARGIN + padresW + estW + 20, currentY - 18 - i * 12, 6);
    });

    // Color Piel
    drawBox(MARGIN + padresW + estW + colorW, currentY - row4Height, colorW, row4Height);
    drawTextCentered(
      'Color de la Piel',
      MARGIN + padresW + estW + colorW,
      currentY - 8,
      colorW,
      7,
      true,
    );
    [
      ['Blanca', 'Negra'],
      ['Amarilla', 'Mulata'],
      ['Albina', ''],
    ].forEach((fila, row) => {
      fila.forEach((color, col) => {
        if (color) {
          const checked = (profesor.colorPiel || '').toLowerCase().includes(color.toLowerCase());
          drawCheckbox(
            MARGIN + padresW + estW + colorW + 5 + col * (colorW / 2),
            currentY - 18 - row * 13,
            checked,
          );
          drawTextLeft(
            color,
            MARGIN + padresW + estW + colorW + 17 + col * (colorW / 2),
            currentY - 18 - row * 13,
            6,
          );
        }
      });
    });

    // Color Cabello
    drawBox(MARGIN + padresW + estW + colorW * 2, currentY - row4Height, colorW, row4Height);
    drawTextCentered(
      'Color Cabello',
      MARGIN + padresW + estW + colorW * 2,
      currentY - 8,
      colorW,
      7,
      true,
    );
    [
      ['Canoso', 'Castaño'],
      ['Negro', 'Rojo'],
      ['Rubio', 'Otros'],
    ].forEach((fila, row) => {
      fila.forEach((color, col) => {
        const checked = (profesor.colorPelo || '').toLowerCase().includes(color.toLowerCase());
        drawCheckbox(
          MARGIN + padresW + estW + colorW * 2 + 5 + col * (colorW / 2),
          currentY - 18 - row * 13,
          checked,
        );
        drawTextLeft(
          color,
          MARGIN + padresW + estW + colorW * 2 + 17 + col * (colorW / 2),
          currentY - 18 - row * 13,
          6,
        );
      });
    });
    currentY -= row4Height;

    // 7. CARACTERÍSTICAS ESPECIALES
    drawBox(MARGIN, currentY - 30, CONTENT_WIDTH, 30);
    drawTextCentered('Características Especiales', MARGIN, currentY - 8, CONTENT_WIDTH, 7, true);
    drawTextLeft(profesor.senasParticulares || 'Ninguna', MARGIN + 10, currentY - 20, 8);
    currentY -= 30;

    // 8. PAÍS Y CIUDADANÍA
    drawBox(MARGIN, currentY - 15, CONTENT_WIDTH / 2, 15);
    drawTextCentered('CUBA', MARGIN, currentY - 8, CONTENT_WIDTH / 2, 9, true);
    drawBox(MARGIN + CONTENT_WIDTH / 2, currentY - 15, CONTENT_WIDTH / 2, 15);
    drawTextCentered(
      'CUBANA',
      MARGIN + CONTENT_WIDTH / 2,
      currentY - 8,
      CONTENT_WIDTH / 2,
      9,
      true,
    );
    currentY -= 15;

    // 9. DATOS DE NACIMIENTO
    const colNac = CONTENT_WIDTH / 5;
    const nacLabels = [
      'País Nacimiento',
      'Provincia',
      'Municipio/Ciudad',
      'Ciudad en el extranjero',
      'Ciudadanía',
    ];
    const nacValues = [
      profesor.paisNacimiento?.nombre || 'Cuba',
      profesor.provincia?.nombre || '',
      profesor.municipio?.nombre || '',
      profesor.ciudadEnElExtranjero || '',
      'Cubana',
    ];
    nacLabels.forEach((label, i) => {
      drawBox(MARGIN + i * colNac, currentY - 25, colNac, 25);
      drawTextCentered(label, MARGIN + i * colNac, currentY - 8, colNac, 6, true);
      drawTextCentered(nacValues[i], MARGIN + i * colNac, currentY - 18, colNac, 8);
    });
    currentY -= 25;

    // 10. LICENCIADO EN EDUCACIÓN
    drawBox(MARGIN, currentY - 15, CONTENT_WIDTH, 15);
    drawTextCentered('LICENCIADO EN EDUCACIÓN', MARGIN, currentY - 8, CONTENT_WIDTH, 9, true);
    currentY -= 15;

    // 11. PROFESIÓN Y LUGAR DE TRABAJO
    const col2 = CONTENT_WIDTH / 2;
    drawBox(MARGIN, currentY - 25, col2, 25);
    drawTextCentered('Profesión', MARGIN, currentY - 8, col2, 7, true);
    drawTextCentered(
      profesor.cargo?.nombre || profesor.especialidad?.nombre || '',
      MARGIN,
      currentY - 18,
      col2,
      8,
    );
    drawBox(MARGIN + col2, currentY - 25, col2, 25);
    drawTextCentered('Lugar de Trabajo', MARGIN + col2, currentY - 8, col2, 7, true);
    drawTextCentered('MINED', MARGIN + col2, currentY - 18, col2, 8);
    currentY -= 25;

    // 12. DIRECCIÓN ACTUAL - HEADER
    drawBox(MARGIN, currentY - 18, CONTENT_WIDTH, 18);
    drawTextCentered('CUBA', MARGIN + 50, currentY - 8, 50, 9, true);
    drawTextCentered(
      'Dirección Actual',
      MARGIN + CONTENT_WIDTH / 2 - 50,
      currentY - 8,
      CONTENT_WIDTH,
      8,
      true,
    );
    currentY -= 18;

    // 13. DIRECCIÓN FILA 1
    const col4 = CONTENT_WIDTH / 4;
    const dirLabels1 = ['País', 'Provincia', 'Municipio/Ciudad', 'Calle'];
    const dirVals1 = [
      'Cuba',
      profesor.provincia?.nombre || '',
      profesor.municipio?.nombre || '',
      profesor.calle || '',
    ];
    dirLabels1.forEach((label, i) => {
      drawBox(MARGIN + i * col4, currentY - 25, col4, 25);
      drawTextCentered(label, MARGIN + i * col4, currentY - 8, col4, 7, true);
      drawTextCentered(dirVals1[i], MARGIN + i * col4, currentY - 18, col4, 8);
    });
    currentY -= 25;

    // 14. DIRECCIÓN FILA 2
    const col5dir = CONTENT_WIDTH / 5;
    const dirLabels2 = ['Carretera', 'Entre1', 'Entre2', 'Número', 'Km.'];
    const entreCalles = (profesor.entreCalles || '').split(' y ');
    const dirVals2 = [
      profesor.carretera || '',
      entreCalles[0] || '',
      entreCalles[1] || '',
      profesor.numero || '',
      profesor.km || '',
    ];
    dirLabels2.forEach((label, i) => {
      drawBox(MARGIN + i * col5dir, currentY - 22, col5dir, 22);
      drawTextCentered(label, MARGIN + i * col5dir, currentY - 8, col5dir, 7, true);
      drawTextCentered(dirVals2[i], MARGIN + i * col5dir, currentY - 16, col5dir, 8);
    });
    currentY -= 22;

    // 15. DIRECCIÓN FILA 3
    const dirLabels3 = ['Apto', 'CPA', 'Finca', 'Localidad', 'Circunscripción'];
    const dirVals3 = [
      profesor.apto || '',
      profesor.cpa || '',
      profesor.finca || '',
      profesor.localidad || '',
      profesor.circunscripcion || '',
    ];
    dirLabels3.forEach((label, i) => {
      drawBox(MARGIN + i * col5dir, currentY - 22, col5dir, 22);
      drawTextCentered(label, MARGIN + i * col5dir, currentY - 8, col5dir, 7, true);
      drawTextCentered(dirVals3[i], MARGIN + i * col5dir, currentY - 16, col5dir, 8);
    });

    // ========== PÁGINA 2: USO OFICIAL ==========
    const page2 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    currentY = PAGE_HEIGHT - MARGIN;

    // 1. SOLO PARA USO OFICIAL
    drawBox(MARGIN, currentY - 28, CONTENT_WIDTH, 28, page2);
    drawTextCentered(
      'SOLO PARA USO OFICIAL',
      MARGIN,
      currentY - 12,
      CONTENT_WIDTH,
      12,
      true,
      page2,
    );
    currentY -= 28;

    // 2. DEL PASAPORTE ANTERIOR
    drawBox(MARGIN, currentY - 20, CONTENT_WIDTH, 20, page2);
    drawTextLeft('Del Pasaporte Anterior', MARGIN + 5, currentY - 12, 8, true, page2);
    currentY -= 20;

    // 3. NO. PASAPORTE, FECHA, LUGAR
    const col3p2 = CONTENT_WIDTH / 3;
    ['No. Pasaporte', 'Fecha Emisión', 'Lugar Emisión'].forEach((label, i) => {
      drawBox(MARGIN + i * col3p2, currentY - 22, col3p2, 22, page2);
      drawTextCentered(label, MARGIN + i * col3p2, currentY - 8, col3p2, 7, true, page2);
    });
    currentY -= 22;

    // 4. TIPO PASAPORTE Y RAZÓN
    const tipoP2W = CONTENT_WIDTH * 0.6;
    const razonW = CONTENT_WIDTH * 0.4;

    drawBox(MARGIN, currentY - 45, tipoP2W, 45, page2);
    drawTextLeft('Tipo Pasaporte', MARGIN + 5, currentY - 12, 7, true, page2);
    ['Corriente', 'Oficial', 'Marino', 'Diplomático', 'Servicio'].forEach((tipo, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const tipoLower = (pasaporte.tipo || '').toLowerCase();
      const checked = tipoLower.includes(tipo.toLowerCase().replace('ó', 'o'));
      const cbX = MARGIN + 10 + col * (tipoP2W / 3);
      const cbY = currentY - 22 - row * 14;
      // Crear función checkbox para página 2
      page2.drawRectangle({
        x: cbX,
        y: cbY + 2,
        width: 8,
        height: 8,
        borderWidth: 1,
        borderColor: rgb(0, 0, 0),
      });
      if (checked) {
        page2.drawText('X', { x: cbX + 1.5, y: cbY + 3, size: 7, font: fontBold });
      }
      page2.drawText(tipo, { x: cbX + 12, y: cbY + 3, size: 6, font });
    });

    drawBox(MARGIN + tipoP2W, currentY - 45, razonW, 45, page2);
    drawTextLeft(
      'Razón de no disponibilidad:',
      MARGIN + tipoP2W + 5,
      currentY - 12,
      7,
      true,
      page2,
    );
    currentY -= 45;

    // 5. LÍNEA DIVISORIA
    drawBox(MARGIN, currentY - 6, CONTENT_WIDTH, 6, page2);
    currentY -= 6;

    // 6. CONSULADO, FUNCIONARIO, FIRMA
    const col3firma = CONTENT_WIDTH / 3;
    const firmaLabels = [
      'Consulado u Órgano de Inmig. Solicitante',
      'Nombres y Apellidos del Funcionario que revisó la solicitud',
      'Firma del Jefe que certifica',
    ];
    firmaLabels.forEach((label, i) => {
      drawBox(MARGIN + i * col3firma, currentY - 35, col3firma, 35, page2);
      drawTextCentered(label, MARGIN + i * col3firma, currentY - 18, col3firma, 6, true, page2);
    });
    currentY -= 35;

    // 7. TEXTO COMPROBATORIO
    drawBox(MARGIN, currentY - 20, CONTENT_WIDTH, 20, page2);
    drawTextCentered(
      'Para la confección del Pasaporte el Titular presentó y se comprobó con:',
      MARGIN,
      currentY - 10,
      CONTENT_WIDTH,
      8,
      true,
      page2,
    );
    currentY -= 20;

    // 8. PASAPORTE VENCIDO
    drawBox(MARGIN, currentY - 18, CONTENT_WIDTH, 18, page2);
    drawTextLeft('Pasaporte Vencido', MARGIN + 5, currentY - 10, 7, true, page2);
    currentY -= 18;
    ['Número', 'Fecha de Expedición', 'Lugar'].forEach((label, i) => {
      drawBox(MARGIN + i * col3p2, currentY - 20, col3p2, 20, page2);
      drawTextCentered(label, MARGIN + i * col3p2, currentY - 8, col3p2, 6, true, page2);
    });
    currentY -= 20;

    // 9. CERTIFICACIÓN DE NACIMIENTO
    drawBox(MARGIN, currentY - 18, CONTENT_WIDTH, 18, page2);
    drawTextLeft('Certificación de Nacimiento', MARGIN + 5, currentY - 10, 7, true, page2);
    currentY -= 18;
    ['Tomo Número', 'Folio Número', 'Registro Civil'].forEach((label, i) => {
      drawBox(MARGIN + i * col3p2, currentY - 20, col3p2, 20, page2);
      drawTextCentered(label, MARGIN + i * col3p2, currentY - 8, col3p2, 6, true, page2);
    });
    currentY -= 20;

    // 10. CARNÉ DE IDENTIDAD
    drawBox(MARGIN, currentY - 18, CONTENT_WIDTH, 18, page2);
    drawTextLeft('Carné de Identidad', MARGIN + 5, currentY - 10, 7, true, page2);
    currentY -= 18;
    drawBox(MARGIN, currentY - 20, col3p2, 20, page2);
    drawTextCentered('Número', MARGIN, currentY - 8, col3p2, 6, true, page2);
    drawTextCentered(profesor.ci, MARGIN, currentY - 16, col3p2, 9, true, page2);
    drawBox(MARGIN + col3p2, currentY - 20, col3p2, 20, page2);
    drawTextCentered('Serie', MARGIN + col3p2, currentY - 8, col3p2, 6, true, page2);
    drawBox(MARGIN + col3p2 * 2, currentY - 20, col3p2, 20, page2);
    currentY -= 20;

    // 11. INSCRIPCIÓN CONSULAR
    drawBox(MARGIN, currentY - 18, CONTENT_WIDTH, 18, page2);
    drawTextLeft('Inscripción Consular', MARGIN + 5, currentY - 10, 7, true, page2);
    currentY -= 18;
    drawBox(MARGIN, currentY - 20, col3p2, 20, page2);
    drawTextCentered('Número', MARGIN, currentY - 8, col3p2, 6, true, page2);
    drawBox(MARGIN + col3p2, currentY - 20, col3p2, 20, page2);
    drawTextCentered('De fecha', MARGIN + col3p2, currentY - 8, col3p2, 6, true, page2);
    drawBox(MARGIN + col3p2 * 2, currentY - 20, col3p2, 20, page2);
    currentY -= 20;

    // 12. OBSERVACIONES Y SELLOS
    const obsW = CONTENT_WIDTH * 0.6;
    const sellosW = CONTENT_WIDTH * 0.4;
    drawBox(MARGIN, currentY - 70, obsW, 70, page2);
    drawTextLeft('Observaciones:', MARGIN + 5, currentY - 12, 7, true, page2);
    drawBox(MARGIN + obsW, currentY - 70, sellosW, 70, page2);
    drawTextCentered('Sellos de Timbre', MARGIN + obsW, currentY - 12, sellosW, 7, true, page2);

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  // ============================================
  // ACTA DE EXTRANJERÍA - FORMATO OFICIAL MININT
  // Usa Playwright + HTML Template
  // ============================================
  async generarActaExtranjeriaPasaporte(pasaporteId: string): Promise<Buffer> {
    const pasaporte = await this.prisma.pasaporte.findUnique({
      where: { id: pasaporteId },
      include: {
        profesor: {
          include: {
            provincia: true,
            municipio: true,
            paisNacimiento: true,
            cargo: true,
            especialidad: true,
          },
        },
      },
    });

    if (!pasaporte) {
      throw new Error('Pasaporte no encontrado');
    }

    const profesor = pasaporte.profesor;
    const tipoPas = pasaporte.tipo?.toUpperCase() || 'P';

    // Fecha actual para el acta
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const ano = String(hoy.getFullYear());

    const data = {
      organismo: 'ICE',
      clave: '',
      numeroActa: pasaporte.numeroArchivo || pasaporte.numero || 'S/N',
      esSalida: true,
      esOficial: tipoPas === 'O',
      esMarino: tipoPas === 'M',
      esCorriente: tipoPas === 'P',
      nombreCompleto: `${profesor.apellidos || ''}, ${profesor.nombre || ''}`.toUpperCase().trim(),
      ciudadania: 'CUBA',
      dia,
      mes,
      ano,
      paisDestino: '', // No tenemos país destino en el modelo Pasaporte
      funcion:
        profesor.cargo?.nombre?.toUpperCase() || profesor.especialidad?.nombre?.toUpperCase() || '',
    };

    return this.pdfGenerator.generarActaExtranjeria(data);
  }

  // ============================================
  // REPORTES EN PDF
  // ============================================

  async generarReporteProfesores(profesores: any[]): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;
    const margin = 50;
    const rowHeight = 20;

    // Header
    page.drawText('REPORTE DE PROFESORES EN POTENCIAL', {
      x: margin,
      y,
      size: 16,
      font: helveticaBold,
    });

    y -= 25;
    page.drawText(`Fecha: ${new Date().toLocaleDateString('es-CU')}`, {
      x: margin,
      y,
      size: 10,
      font: helveticaFont,
    });

    y -= 20;
    page.drawText(`Total: ${profesores.length} profesores`, {
      x: margin,
      y,
      size: 10,
      font: helveticaFont,
    });

    y -= 40;

    // Table Header
    const drawTableHeader = () => {
      page.drawText('CI', { x: margin, y, size: 9, font: helveticaBold });
      page.drawText('Nombre', { x: margin + 80, y, size: 9, font: helveticaBold });
      page.drawText('Apellidos', { x: margin + 200, y, size: 9, font: helveticaBold });
      page.drawText('Estado', { x: margin + 350, y, size: 9, font: helveticaBold });
      page.drawText('Teléfono', { x: margin + 430, y, size: 9, font: helveticaBold });
      y -= 15;
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      y -= 10;
    };

    drawTableHeader();

    // Table Rows
    for (const profesor of profesores) {
      if (y < 100) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - 50;
        drawTableHeader();
      }

      page.drawText(profesor.ci || 'N/A', { x: margin, y, size: 8, font: helveticaFont });
      page.drawText(profesor.nombre || 'N/A', { x: margin + 80, y, size: 8, font: helveticaFont });
      page.drawText(profesor.apellidos || 'N/A', {
        x: margin + 200,
        y,
        size: 8,
        font: helveticaFont,
      });
      page.drawText(profesor.estadoPotencial || 'N/A', {
        x: margin + 350,
        y,
        size: 8,
        font: helveticaFont,
      });
      page.drawText(profesor.telefonoMovil || 'N/A', {
        x: margin + 430,
        y,
        size: 8,
        font: helveticaFont,
      });

      y -= rowHeight;
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  async generarReportePasaportes(pasaportes: any[]): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;
    const margin = 40;
    const rowHeight = 20;

    page.drawText('REPORTE DE PASAPORTES', {
      x: margin,
      y,
      size: 16,
      font: helveticaBold,
    });

    y -= 25;
    page.drawText(`Fecha: ${new Date().toLocaleDateString('es-CU')}`, {
      x: margin,
      y,
      size: 10,
      font: helveticaFont,
    });

    y -= 20;
    page.drawText(`Total: ${pasaportes.length} pasaportes`, {
      x: margin,
      y,
      size: 10,
      font: helveticaFont,
    });

    y -= 40;

    const drawTableHeader = () => {
      page.drawText('No.', { x: margin, y, size: 8, font: helveticaBold });
      page.drawText('Archivo', { x: margin + 40, y, size: 8, font: helveticaBold });
      page.drawText('Profesor', { x: margin + 100, y, size: 8, font: helveticaBold });
      page.drawText('Expedición', { x: margin + 220, y, size: 8, font: helveticaBold });
      page.drawText('Vencimiento', { x: margin + 290, y, size: 8, font: helveticaBold });
      page.drawText('Estado', { x: margin + 360, y, size: 8, font: helveticaBold });
      y -= 15;
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      y -= 10;
    };

    drawTableHeader();

    const hoy = new Date();

    for (const pasaporte of pasaportes) {
      if (y < 100) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - 50;
        drawTableHeader();
      }

      const vencimiento = new Date(pasaporte.fechaVencimiento);
      let estado = 'Vigente';
      if (vencimiento < hoy) estado = 'Vencido';
      else if (vencimiento < new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)) estado = 'Próximo';

      page.drawText(pasaporte.numero || 'N/A', { x: margin, y, size: 7, font: helveticaFont });
      page.drawText(pasaporte.numeroArchivo || 'N/A', {
        x: margin + 40,
        y,
        size: 7,
        font: helveticaFont,
      });
      page.drawText(
        `${pasaporte.profesor?.nombre || ''} ${pasaporte.profesor?.apellidos || ''}`.substring(
          0,
          20,
        ),
        { x: margin + 100, y, size: 7, font: helveticaFont },
      );
      page.drawText(new Date(pasaporte.fechaExpedicion).toLocaleDateString('es-CU'), {
        x: margin + 220,
        y,
        size: 7,
        font: helveticaFont,
      });
      page.drawText(new Date(pasaporte.fechaVencimiento).toLocaleDateString('es-CU'), {
        x: margin + 290,
        y,
        size: 7,
        font: helveticaFont,
      });
      page.drawText(estado, { x: margin + 360, y, size: 7, font: helveticaFont });

      y -= rowHeight;
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  async generarReporteContratos(contratos: any[]): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;
    const margin = 40;
    const rowHeight = 20;

    page.drawText('REPORTE DE CONTRATOS', {
      x: margin,
      y,
      size: 16,
      font: helveticaBold,
    });

    y -= 25;
    page.drawText(`Fecha: ${new Date().toLocaleDateString('es-CU')}`, {
      x: margin,
      y,
      size: 10,
      font: helveticaFont,
    });

    y -= 20;
    page.drawText(`Total: ${contratos.length} contratos`, {
      x: margin,
      y,
      size: 10,
      font: helveticaFont,
    });

    y -= 40;

    const drawTableHeader = () => {
      page.drawText('No.', { x: margin, y, size: 8, font: helveticaBold });
      page.drawText('Profesor', { x: margin + 60, y, size: 8, font: helveticaBold });
      page.drawText('País', { x: margin + 180, y, size: 8, font: helveticaBold });
      page.drawText('Inicio', { x: margin + 260, y, size: 8, font: helveticaBold });
      page.drawText('Fin', { x: margin + 320, y, size: 8, font: helveticaBold });
      page.drawText('Estado', { x: margin + 380, y, size: 8, font: helveticaBold });
      y -= 15;
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      y -= 10;
    };

    drawTableHeader();

    for (const contrato of contratos) {
      if (y < 100) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - 50;
        drawTableHeader();
      }

      page.drawText(`${contrato.numeroConsecutivo}/${contrato.ano}`, {
        x: margin,
        y,
        size: 7,
        font: helveticaFont,
      });
      page.drawText(
        `${contrato.profesor?.nombre || ''} ${contrato.profesor?.apellidos || ''}`.substring(0, 18),
        { x: margin + 60, y, size: 7, font: helveticaFont },
      );
      page.drawText((contrato.pais?.nombre || 'N/A').substring(0, 12), {
        x: margin + 180,
        y,
        size: 7,
        font: helveticaFont,
      });
      page.drawText(new Date(contrato.fechaInicio).toLocaleDateString('es-CU'), {
        x: margin + 260,
        y,
        size: 7,
        font: helveticaFont,
      });
      page.drawText(new Date(contrato.fechaFin).toLocaleDateString('es-CU'), {
        x: margin + 320,
        y,
        size: 7,
        font: helveticaFont,
      });
      page.drawText(contrato.estado || 'N/A', { x: margin + 380, y, size: 7, font: helveticaFont });

      y -= rowHeight;
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  async generarReporteProrrogas(prorrogas: any[]): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;
    const margin = 40;
    const rowHeight = 25;

    page.drawText('REPORTE DE PRÓRROGAS', {
      x: margin,
      y,
      size: 16,
      font: helveticaBold,
    });

    y -= 25;
    page.drawText(`Fecha: ${new Date().toLocaleDateString('es-CU')}`, {
      x: margin,
      y,
      size: 10,
      font: helveticaFont,
    });

    y -= 20;
    page.drawText(`Total: ${prorrogas.length} prórrogas`, {
      x: margin,
      y,
      size: 10,
      font: helveticaFont,
    });

    y -= 40;

    const drawTableHeader = () => {
      page.drawText('Contrato', { x: margin, y, size: 8, font: helveticaBold });
      page.drawText('Prórroga', { x: margin + 70, y, size: 8, font: helveticaBold });
      page.drawText('Profesor', { x: margin + 130, y, size: 8, font: helveticaBold });
      page.drawText('Desde', { x: margin + 240, y, size: 8, font: helveticaBold });
      page.drawText('Hasta', { x: margin + 300, y, size: 8, font: helveticaBold });
      page.drawText('Motivo', { x: margin + 360, y, size: 8, font: helveticaBold });
      y -= 15;
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      y -= 10;
    };

    drawTableHeader();

    for (const prorroga of prorrogas) {
      if (y < 100) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - 50;
        drawTableHeader();
      }

      page.drawText(`${prorroga.contrato?.numeroConsecutivo}/${prorroga.contrato?.ano}`, {
        x: margin,
        y,
        size: 7,
        font: helveticaFont,
      });
      page.drawText(`#${prorroga.numeroProrroga}`, {
        x: margin + 70,
        y,
        size: 7,
        font: helveticaFont,
      });
      page.drawText(
        `${prorroga.contrato?.profesor?.nombre || ''} ${prorroga.contrato?.profesor?.apellidos || ''}`.substring(
          0,
          15,
        ),
        { x: margin + 130, y, size: 7, font: helveticaFont },
      );
      page.drawText(new Date(prorroga.fechaDesde).toLocaleDateString('es-CU'), {
        x: margin + 240,
        y,
        size: 7,
        font: helveticaFont,
      });
      page.drawText(new Date(prorroga.fechaHasta).toLocaleDateString('es-CU'), {
        x: margin + 300,
        y,
        size: 7,
        font: helveticaFont,
      });
      page.drawText((prorroga.motivo || 'N/A').substring(0, 20), {
        x: margin + 360,
        y,
        size: 7,
        font: helveticaFont,
      });

      y -= rowHeight;
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

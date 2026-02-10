import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  /**
   * Busca el template en múltiples ubicaciones posibles.
   * Funciona tanto en desarrollo (src/) como en producción (dist/).
   */
  private findTemplatePath(templateName: string): string {
    const possiblePaths = [
      // Desarrollo: desde src/modules/tramites/services/
      path.join(__dirname, '..', '..', '..', 'templates', templateName),
      // Desarrollo: desde src/modules/tramites/services/ (un nivel más arriba)
      path.join(__dirname, '..', '..', '..', '..', 'templates', templateName),
      // Producción: desde dist/modules/tramites/services/
      path.join(__dirname, '..', '..', '..', 'templates', templateName),
      // Producción: desde dist/src/modules/tramites/services/
      path.join(__dirname, '..', '..', '..', '..', 'templates', templateName),
      // Ruta absoluta desde raíz del proyecto (fallback)
      path.join(process.cwd(), 'src', 'templates', templateName),
      path.join(process.cwd(), 'apps', 'api', 'src', 'templates', templateName),
    ];

    for (const templatePath of possiblePaths) {
      if (fs.existsSync(templatePath)) {
        this.logger.debug(`Template encontrado en: ${templatePath}`);
        return templatePath;
      }
    }

    // Si no se encuentra, devolver el primero para que el error sea claro
    this.logger.error(
      `Template no encontrado en ninguna ubicación. Buscado en:\n${possiblePaths.join('\n')}`,
    );
    return possiblePaths[0];
  }

  private async generatePdfFromTemplate(
    templateName: string,
    data: any,
    filename: string,
  ): Promise<Buffer> {
    // Buscar template en múltiples ubicaciones
    const templatePath = this.findTemplatePath(templateName);

    // Verificar que el archivo existe
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template no encontrado: ${templateName}. Buscado en: ${templatePath}`);
    }

    // Leer template HTML
    const templateHtml = fs.readFileSync(templatePath, 'utf-8');

    // Compilar con Handlebars
    const template = handlebars.compile(templateHtml);
    const html = template(data);

    // Lanzar navegador
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      // Cargar HTML
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      // Generar PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  async generarActaExtranjeria(data: {
    organismo: string;
    clave: string;
    numeroActa: string;
    esSalida: boolean;
    esOficial: boolean;
    esMarino: boolean;
    esCorriente: boolean;
    nombreCompleto: string;
    ciudadania: string;
    dia: string;
    mes: string;
    ano: string;
    paisDestino?: string;
    funcion?: string;
  }): Promise<Buffer> {
    const templateData = {
      ...data,
      filasVacias: [2, 3, 4, 5, 6, 7, 8, 9],
      fechaGeneracion: new Date().toLocaleString('es-CU'),
    };

    return this.generatePdfFromTemplate('acta-extranjeria.html', templateData, 'acta-extranjeria');
  }
}

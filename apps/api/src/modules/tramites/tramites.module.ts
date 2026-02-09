import { Module } from '@nestjs/common';
import { PasaportesController } from './controllers/pasaportes.controller';
import { VisasController } from './controllers/visas.controller';
import { PasaportesImportController } from './controllers/pasaportes-import.controller';
import { PasaportesService } from './services/pasaportes.service';
import { VisasService } from './services/visas.service';
import { PdfService } from './services/pdf.service';
import { PasaportesImportService } from './services/pasaportes-import.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PasaportesController, VisasController, PasaportesImportController],
  providers: [PasaportesService, VisasService, PdfService, PasaportesImportService],
  exports: [PasaportesService, VisasService, PdfService, PasaportesImportService],
})
export class TramitesModule {}

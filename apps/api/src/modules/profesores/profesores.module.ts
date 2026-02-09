import { Module } from '@nestjs/common';
import { ProfesoresController } from './controllers/profesores.controller';
import { ProfesoresService } from './services/profesores.service';
import { CsvImportService } from './services/csv-import.service';
import { PotencialImportService } from './services/potencial-import.service';
import { AuthModule } from '../auth/auth.module';
import { TramitesModule } from '../tramites/tramites.module';
import { PapeleraModule } from '../papelera/papelera.module';

@Module({
  imports: [AuthModule, TramitesModule, PapeleraModule],
  controllers: [ProfesoresController],
  providers: [ProfesoresService, CsvImportService, PotencialImportService],
  exports: [ProfesoresService, CsvImportService, PotencialImportService],
})
export class ProfesoresModule {}

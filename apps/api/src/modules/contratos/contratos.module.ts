import { Module } from '@nestjs/common';
import { ContratosController } from './controllers/contratos.controller';
import { ProrrogasController } from './controllers/prorrogas.controller';
import { ContratosService } from './services/contratos.service';
import { ProrrogasService } from './services/prorrogas.service';
import { AuthModule } from '../auth/auth.module';
import { TramitesModule } from '../tramites/tramites.module';

@Module({
  imports: [AuthModule, TramitesModule],
  controllers: [ContratosController, ProrrogasController],
  providers: [ContratosService, ProrrogasService],
  exports: [ContratosService, ProrrogasService],
})
export class ContratosModule {}

import { Module } from '@nestjs/common';
import { ActasExtranjeriaService } from './services/actas-extranjeria.service';
import { ActasExtranjeriaController } from './controllers/actas-extranjeria.controller';
import { TramitesModule } from '../tramites/tramites.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TramitesModule, AuthModule],
  controllers: [ActasExtranjeriaController],
  providers: [ActasExtranjeriaService],
  exports: [ActasExtranjeriaService],
})
export class ActasExtranjeriaModule {}

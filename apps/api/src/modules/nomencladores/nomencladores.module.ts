import { Module } from '@nestjs/common';
import { NomencladoresController } from './controllers/nomencladores.controller';
import { NomencladoresService } from './services/nomencladores.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [NomencladoresController],
  providers: [NomencladoresService],
  exports: [NomencladoresService],
})
export class NomencladoresModule {}

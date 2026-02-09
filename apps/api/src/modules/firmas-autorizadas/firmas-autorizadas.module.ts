import { Module } from '@nestjs/common';
import { FirmasAutorizadasService } from './services/firmas-autorizadas.service';
import { FirmasAutorizadasController } from './controllers/firmas-autorizadas.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FirmasAutorizadasController],
  providers: [FirmasAutorizadasService],
  exports: [FirmasAutorizadasService],
})
export class FirmasAutorizadasModule {}

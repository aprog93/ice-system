import { Module } from '@nestjs/common';
import { PapeleraController } from './papelera.controller';
import { PapeleraService } from './papelera.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PapeleraController],
  providers: [PapeleraService],
  exports: [PapeleraService],
})
export class PapeleraModule {}

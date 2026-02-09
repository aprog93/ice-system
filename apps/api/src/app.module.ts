import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { ProfesoresModule } from './modules/profesores/profesores.module';
import { PotencialModule } from './modules/potencial/potencial.module';
import { TramitesModule } from './modules/tramites/tramites.module';
import { ContratosModule } from './modules/contratos/contratos.module';
import { NomencladoresModule } from './modules/nomencladores/nomencladores.module';
import { ConfiguracionModule } from './modules/configuracion/configuracion.module';
import { PapeleraModule } from './modules/papelera/papelera.module';
import { FirmasAutorizadasModule } from './modules/firmas-autorizadas/firmas-autorizadas.module';
import { ActasExtranjeriaModule } from './modules/actas-extranjeria/actas-extranjeria.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './common/controllers/health.controller';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig],
      envFilePath: ['.env', '../../.env'],
    }),
    // Rate limiting: 10 requests per 60 seconds per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 10, // 10 requests
      },
    ]),
    DatabaseModule,
    AuthModule,
    ProfesoresModule,
    PotencialModule,
    TramitesModule,
    ContratosModule,
    NomencladoresModule,
    ConfiguracionModule,
    PapeleraModule,
    FirmasAutorizadasModule,
    ActasExtranjeriaModule,
  ],
  controllers: [HealthController],
  providers: [
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply request logger to all routes except health checks
    consumer
      .apply(RequestLoggerMiddleware)
      .exclude('health') // Exclude health check endpoints from logging
      .forRoutes('*');
  }
}

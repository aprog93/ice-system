import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable default body parser to handle multipart
    logger: ['error', 'warn', 'log', 'debug'], // Enable all log levels
  });
  const configService = app.get(ConfigService);

  // Import and configure raw body parser for JSON routes only
  const { json, urlencoded } = require('body-parser');
  app.use(json({ limit: '10mb' })); // Limit payload size
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Security middleware - Production hardened
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow embedding
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    }),
  );
  app.use(compression());
  app.use(cookieParser());

  // Request logging middleware
  const requestLogger = new RequestLoggerMiddleware();
  app.use((req, res, next) => requestLogger.use(req, res, next));

  // CORS
  const corsOrigins = [
    'http://localhost:3000',
    'http://192.168.36.82:3000',
    'http://192.168.36.82',
    configService.get('CORS_ORIGIN'),
  ].filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Sistema ICE API')
    .setDescription('API del Sistema de Cooperación Internacional de Educadores')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Start server
  const port = configService.get('PORT') || 3001;
  await app.listen(port);

  console.log(`🚀 API running on: http://localhost:${port}/api/v1`);
  console.log(`📚 Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();

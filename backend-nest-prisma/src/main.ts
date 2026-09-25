import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Import global filters, interceptors, guards //
import {
  createCorrelationId,
  HttpExceptionFilter,
  LoggingInterceptor,
  runWithCorrelationId,
  sanitizeLogText,
  TransformResponseInterceptor,
} from '@app/common';

// Import security packages
import helmet from 'helmet';
import compression from 'compression';
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';

/**
 * Main Application Bootstrap
 *
 * 📚 INDUSTRY STANDARD IMPLEMENTATION
 *
 * Features:
 * ✅ Global pipes (validation)
 * ✅ Global filters (exception handling)
 * ✅ Global interceptors (transform, logging)
 * ✅ Security (Helmet, CORS)
 * ✅ Compression
 * ✅ Swagger documentation
 * ✅ Graceful shutdown
 * ✅ Socket.IO integration ⭐
 * ✅ BullMQ workers ⭐
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  // rawBody is required for HMAC signature verification of provider webhooks
  // (Stripe, RevenueCat) — re-serialized JSON breaks signature checks.
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 6733);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const customerWebUrl = configService.get<string>(
    'CUSTOMER_WEB_URL',
    'http://localhost:3000',
  );
  const adminWebUrl = configService.get<string>(
    'ADMIN_WEB_URL',
    'http://localhost:3001',
  );

  // ────────────────────────────────────────────────────────────────────────
  // Security
  // ────────────────────────────────────────────────────────────────────────

  app.use((request: Request, response: Response, next: NextFunction) => {
    const correlationId = createCorrelationId(
      request.headers['x-correlation-id'] ?? request.headers['x-request-id'],
    );
    response.setHeader('X-Correlation-ID', correlationId);
    runWithCorrelationId(correlationId, next);
  });

  // Helmet - Security headers
  app.use(helmet());

  // CORS - Cross-Origin Resource Sharing
  app.enableCors({
    origin: [customerWebUrl, adminWebUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Correlation-ID',
      'X-Request-ID',
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-Correlation-ID',
    ],
  });

  // ────────────────────────────────────────────────────────────────────────
  // Compression
  // ────────────────────────────────────────────────────────────────────────

  // Gzip compression
  app.use(compression());

  // ────────────────────────────────────────────────────────────────────────
  // Global Pipes
  // ────────────────────────────────────────────────────────────────────────

  // Validation pipe - validates all incoming requests
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if extra properties
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // ────────────────────────────────────────────────────────────────────────
  // Global Filters
  // ────────────────────────────────────────────────────────────────────────

  // HTTP exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // ────────────────────────────────────────────────────────────────────────
  // Global Interceptors
  // ────────────────────────────────────────────────────────────────────────

  // Transform response interceptor
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // Logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ────────────────────────────────────────────────────────────────────────
  // API Prefix
  // ────────────────────────────────────────────────────────────────────────

  app.setGlobalPrefix(apiPrefix, {
    exclude: ['/socket.io', '/socket.io/(.*)', 'health/live', 'health/ready'],
  });

  // ────────────────────────────────────────────────────────────────────────
  // Swagger Documentation
  // ────────────────────────────────────────────────────────────────────────

  // Swagger is a development convenience: never expose API docs in production.
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('BD Masjid — Mosque Information & Community API')
      .setDescription(
        'Modular NestJS backend with PostgreSQL/PostGIS for mosque discovery, prayer schedules, attendance, and verification',
      )
      .setVersion('1.0.0')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      })
      .addTag(
        'Mosques',
        'Mosque registry, pin-drop creation, and nearby geospatial queries',
      )
      .addTag(
        'Prayer Schedules',
        'Prayer and Jamaat schedule mutations, snapshots, and history',
      )
      .addTag(
        'Attendance',
        'User regular and occasional mosque attendance tracking',
      )
      .addTag(
        'Suggestions & Reports',
        'Community schedule updates and issue reporting',
      )
      .addTag(
        'Admin Verification',
        'Administrative mosque verification and moderation pipelines',
      )
      .addTag('Authentication', 'User authentication endpoints')
      .addTag('Users', 'User profile management endpoints')
      .addTag(
        'Health & Operations',
        'Liveness, readiness, and diagnostic metrics',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Graceful Shutdown
  // ────────────────────────────────────────────────────────────────────────

  // Enable shutdown hooks
  app.enableShutdownHooks();

  // Handle process termination
  process.on('SIGTERM', () => {
    logger.log('SIGTERM signal received: closing HTTP server');
    void app.close().then(() => {
      logger.log('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.log('SIGINT signal received: closing HTTP server');
    void app.close().then(() => {
      logger.log('HTTP server closed');
      process.exit(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Start Application
  // ────────────────────────────────────────────────────────────────────────

  const socketPort = configService.get<number>('SOCKET_PORT', 6734);

  await app.listen(port, '0.0.0.0'); // for react native

  logger.log(`🚀 REST Backend HTTP server started on port ${port}`);
  logger.log(`⚡ Socket.IO Gateway server running on port ${socketPort}`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`📡 API Prefix: ${apiPrefix}`);
  logger.log(`🔗 API URL: http://localhost:${port}/${apiPrefix}`);
  logger.log(`🛍️ Customer Web: ${customerWebUrl}`);
  logger.log(`🧭 Admin Web: ${adminWebUrl}`);
}

// Bootstrap the application
bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error(`Failed to start application: ${sanitizeLogText(error)}`);
  process.exit(1);
});

import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createLoggerConfig } from './config/logger.config';
import { DEFAULT_PORT, GRACEFUL_SHUTDOWN_TIMEOUT_MS } from './common/constants';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

function configureCors(
  app: Awaited<ReturnType<typeof NestFactory.create>>,
): void {
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
      ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
}

function configureSwagger(
  app: Awaited<ReturnType<typeof NestFactory.create>>,
): void {
  const config = new DocumentBuilder()
    .setTitle('USAsset API')
    .setDescription('USAsset backend API documentation')
    .setVersion('1.0')
    .addTag('users', 'User management endpoints')
    .addTag('health', 'Health check endpoints')
    .addTag('logs', 'Logging and debugging endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
}

function logStartupInfo(logger: Logger, port: string | number): void {
  logger.log(`Application is running on port ${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  if (process.env.LOG_TO_FILE === 'true') {
    logger.log('File logging enabled - check logs/ directory');
  }
}

function handleStartupError(logger: Logger, error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  logger.error('Failed to start application:', errorMessage);

  if (errorMessage?.includes('Validation')) {
    logger.error(
      'Configuration validation failed. Check your environment variables.',
    );
    logger.error(
      'In production, ensure Azure Key Vault secrets are properly configured.',
    );
  }

  process.exit(1);
}

function setupGracefulShutdown(
  app: Awaited<ReturnType<typeof NestFactory.create>>,
  logger: Logger,
): void {
  const shutdown = async (signal: string): Promise<void> => {
    logger.log(`Received ${signal}, shutting down gracefully`);

    // Force exit after timeout if graceful shutdown fails
    const forceExitTimer = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);

    try {
      await app.close();
      clearTimeout(forceExitTimer);
      logger.log('Application shut down successfully');
      process.exit(0);
    } catch (error) {
      clearTimeout(forceExitTimer);
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

function configureApp(
  app: Awaited<ReturnType<typeof NestFactory.create>>,
): void {
  configureCors(app);
  configureSwagger(app);

  const globalExceptionFilter = app.get(GlobalExceptionFilter);
  const responseTransformInterceptor = app.get(ResponseTransformInterceptor);
  app.useGlobalFilters(globalExceptionFilter);
  app.useGlobalInterceptors(responseTransformInterceptor);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  try {
    logger.log('Starting NestJS application...');

    const app = await NestFactory.create(AppModule, {
      logger: createLoggerConfig(),
    });

    configureApp(app);
    setupGracefulShutdown(app, logger);

    const port = process.env.PORT ?? DEFAULT_PORT;
    await app.listen(port);

    logStartupInfo(logger, port);
  } catch (error) {
    handleStartupError(logger, error);
  }
}

void bootstrap();

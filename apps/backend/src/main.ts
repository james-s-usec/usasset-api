import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { createLoggerConfig } from './config/logger.config';
import { DEFAULT_PORT } from './common/constants';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

function configureCors(
  app: Awaited<ReturnType<typeof NestFactory.create>>,
): void {
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });
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

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  try {
    logger.log('Starting NestJS application...');

    const app = await NestFactory.create(AppModule, {
      logger: createLoggerConfig(),
    });

    configureCors(app);

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

    const port = process.env.PORT ?? DEFAULT_PORT;
    await app.listen(port);

    logStartupInfo(logger, port);
  } catch (error) {
    handleStartupError(logger, error);
  }
}

void bootstrap();

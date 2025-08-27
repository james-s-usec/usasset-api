import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { createLoggerConfig } from './config/logger.config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    logger.log('Starting NestJS application...');
    
    const app = await NestFactory.create(AppModule, {
      logger: createLoggerConfig(),
    });
    
    // Enable CORS with environment-based configuration
    app.enableCors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    });
    
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    logger.log(`Application is running on port ${port}`);
    logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    if (process.env.LOG_TO_FILE === 'true') {
      logger.log('File logging enabled - check logs/ directory');
    }
  } catch (error) {
    logger.error('Failed to start application:', error.message);
    if (error.message?.includes('Validation')) {
      logger.error('Configuration validation failed. Check your environment variables.');
      logger.error('In production, ensure Azure Key Vault secrets are properly configured.');
    }
    process.exit(1);
  }
}
void bootstrap();

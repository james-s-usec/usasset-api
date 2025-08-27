import { Logger } from '@nestjs/common';

export const configFactory = () => {
  const logger = new Logger('ConfigFactory');
  
  const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
    DATABASE_URL: process.env.DATABASE_URL,
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
    JWT_SECRET: process.env.JWT_SECRET,
    API_KEY: process.env.API_KEY,
    LOG_TO_FILE: process.env.LOG_TO_FILE === 'true',
  };

  // Debug logging with proper logger
  logger.log('Configuration Loading');
  logger.debug(`Environment: ${config.NODE_ENV}`);
  logger.debug(`Port: ${config.PORT}`);
  logger.debug(`CORS Origin: ${config.CORS_ORIGIN}`);
  logger.debug(`Database URL: ${config.DATABASE_URL ? '[SET]' : '[NOT SET]'}`);
  logger.debug(`JWT Secret: ${config.JWT_SECRET ? '[SET]' : '[NOT SET]'}`);
  logger.debug(`API Key: ${config.API_KEY ? '[SET]' : '[NOT SET]'}`);
  logger.debug(`Log to file: ${config.LOG_TO_FILE}`);

  return config;
};
import { Logger } from '@nestjs/common';

const createConfig = (): Record<string, unknown> => ({
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET,
  API_KEY: process.env.API_KEY,
  LOG_TO_FILE: process.env.LOG_TO_FILE === 'true',
  PIPELINE_USE_ORCHESTRATOR: process.env.PIPELINE_USE_ORCHESTRATOR === 'true',
  PHASE_SAMPLE_SIZE: parseInt(process.env.PHASE_SAMPLE_SIZE || '5', 10),
});

const logConfiguration = (
  logger: Logger,
  config: Record<string, unknown>,
): void => {
  logger.log('Configuration Loading');
  logger.debug(`Environment: ${config.NODE_ENV}`);
  logger.debug(`Port: ${config.PORT}`);
  logger.debug(`CORS Origin: ${config.CORS_ORIGIN}`);
  logger.debug(`Database URL: ${config.DATABASE_URL ? '[SET]' : '[NOT SET]'}`);
  logger.debug(`JWT Secret: ${config.JWT_SECRET ? '[SET]' : '[NOT SET]'}`);
  logger.debug(`API Key: ${config.API_KEY ? '[SET]' : '[NOT SET]'}`);
  logger.debug(`Log to file: ${config.LOG_TO_FILE}`);
  logger.debug(
    `Pipeline use orchestrator: ${config.PIPELINE_USE_ORCHESTRATOR}`,
  );
  logger.debug(`Phase sample size: ${config.PHASE_SAMPLE_SIZE}`);
};

export const configFactory = (): Record<string, unknown> => {
  const logger = new Logger('ConfigFactory');
  const config = createConfig();

  logConfiguration(logger, config);
  return config;
};

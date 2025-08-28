import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { join } from 'path';
import { LoggerService } from '@nestjs/common';

const logDir = join(process.cwd(), 'logs');

function createConsoleTransport(
  isDevelopment: boolean,
): winston.transports.ConsoleTransportInstance {
  return new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      isDevelopment
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          )
        : winston.format.json(),
    ),
  });
}

function createFileTransport(
  filename: string,
  level?: string,
): winston.transports.FileTransportInstance {
  return new winston.transports.File({
    filename: join(logDir, filename),
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
  });
}

function shouldUseFileTransports(isDevelopment: boolean): boolean {
  return !isDevelopment || process.env.LOG_TO_FILE === 'true';
}

export const createLoggerConfig = (): LoggerService => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const transports: winston.transport[] = [
    createConsoleTransport(isDevelopment),
  ];

  if (shouldUseFileTransports(isDevelopment)) {
    transports.push(
      createFileTransport('error.log', 'error'),
      createFileTransport('combined.log'),
    );
  }

  return WinstonModule.createLogger({
    level: isDevelopment ? 'debug' : 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
    ),
    transports,
  });
};

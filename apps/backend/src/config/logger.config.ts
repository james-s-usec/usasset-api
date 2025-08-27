import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { join } from 'path';

const logDir = join(process.cwd(), 'logs');

export const createLoggerConfig = () => {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const transports: winston.transport[] = [
    // Console transport
    new winston.transports.Console({
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
    }),
  ];

  // File transports (only in production or if LOG_TO_FILE is set)
  if (!isDevelopment || process.env.LOG_TO_FILE === 'true') {
    transports.push(
      // Error log file
      new winston.transports.File({
        filename: join(logDir, 'error.log'),
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
      }),
      // Combined log file
      new winston.transports.File({
        filename: join(logDir, 'combined.log'),
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
      }),
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

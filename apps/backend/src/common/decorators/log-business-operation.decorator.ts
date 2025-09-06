import { Logger } from '@nestjs/common';

interface LogContext {
  duration: number;
  timestamp: string;
}

interface ErrorLogContext extends LogContext {
  error: string;
  errorType: string;
  stack?: string;
  inputs: unknown[];
}

function createLogContext(startTime: number): LogContext {
  return {
    duration: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}

function createErrorLogContext(
  startTime: number,
  error: unknown,
  inputs: unknown[],
): ErrorLogContext {
  const baseContext = createLogContext(startTime);
  return {
    ...baseContext,
    error: error instanceof Error ? error.message : 'Unknown error',
    errorType: error?.constructor?.name || 'Unknown',
    stack: error instanceof Error ? error.stack : undefined,
    inputs,
  };
}

interface ExecutionParams {
  originalMethod: (...args: unknown[]) => Promise<unknown>;
  context: unknown;
  args: unknown[];
  opName: string;
  logger: Logger;
}

async function executeWithLogging(params: ExecutionParams): Promise<unknown> {
  const startTime = Date.now();

  params.logger.debug(`🎯 STARTING ${params.opName}`, {
    inputs: params.args,
    timestamp: new Date().toISOString(),
  });

  const result = await params.originalMethod.apply(params.context, params.args);
  const logContext = createLogContext(startTime);

  params.logger.log(
    `✅ COMPLETED ${params.opName} in ${logContext.duration}ms`,
    {
      result,
      ...logContext,
    },
  );

  return result;
}

/**
 * Decorator that automatically logs business operations with input/output/errors
 * Eliminates need for manual console.log debugging
 */
function createDecoratorFunction(
  originalMethod: (...args: unknown[]) => Promise<unknown>,
  opName: string,
  logger: Logger,
): (...args: unknown[]) => Promise<unknown> {
  return async function (this: unknown, ...args: unknown[]): Promise<unknown> {
    try {
      return await executeWithLogging({
        originalMethod,
        context: this,
        args,
        opName,
        logger,
      });
    } catch (error: unknown) {
      const errorContext = createErrorLogContext(Date.now(), error, args);
      logger.error(
        `❌ FAILED ${opName} after ${errorContext.duration}ms`,
        errorContext,
      );
      throw error;
    }
  };
}

export function LogBusinessOperation(operationName?: string): MethodDecorator {
  return function (
    target: unknown,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (
      ...args: unknown[]
    ) => Promise<unknown>;
    const className = (target as { constructor: { name: string } }).constructor
      .name;
    const opName = operationName || `${className}.${String(propertyKey)}`;
    const logger = new Logger(className);

    descriptor.value = createDecoratorFunction(originalMethod, opName, logger);
    return descriptor;
  };
}

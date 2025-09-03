import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validationSchema } from './config/env.validation';
import { configFactory } from './config/config.factory';
import { UserModule } from './user/user.module';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { DatabaseLoggerModule } from './common/database-logger.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { LogsModule } from './logs/logs.module';
import { ProjectModule } from './features/projects/project.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // In production, Azure injects Key Vault secrets as env vars
      // In development, use local .env file
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      load: [configFactory],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    DatabaseModule,
    DatabaseLoggerModule,
    UserModule,
    HealthModule,
    LogsModule,
    ProjectModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService, GlobalExceptionFilter, ResponseTransformInterceptor],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}

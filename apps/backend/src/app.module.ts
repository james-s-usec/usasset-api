import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validationSchema } from './config/env.validation';
import { configFactory } from './config/config.factory';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { FilesController } from './controllers/files.controller';
import { AzureBlobStorageService } from './services/azure-blob-storage.service';
import { PdfProcessingService } from './services/pdf-processing.service';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [FilesController],
  providers: [AzureBlobStorageService, PdfProcessingService],
  exports: [AzureBlobStorageService, PdfProcessingService],
})
export class FilesModule {}

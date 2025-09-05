import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { FilesModule } from '../files/files.module';
import { DocumentsService } from './services/documents.service';

@Module({
  imports: [DatabaseModule, FilesModule],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { FilesModule } from '../files/files.module';
import { DocumentsService } from './services/documents.service';
import { AssetNotesService } from './services/asset-notes.service';

@Module({
  imports: [DatabaseModule, FilesModule],
  providers: [DocumentsService, AssetNotesService],
  exports: [DocumentsService, AssetNotesService],
})
export class DocumentsModule {}

import { Module } from '@nestjs/common';
import { FolderController } from './folder.controller';
import { FolderService } from './folder.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FolderController],
  providers: [FolderService],
  exports: [FolderService], // Export for use by files module
})
export class FolderModule {}

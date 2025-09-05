import { Module } from '@nestjs/common';
import { AssetController } from './controllers/asset.controller';
import { AssetService } from './services/asset.service';
import { AssetQueryService } from './services/asset-query.service';
import { AssetBulkService } from './services/asset-bulk.service';
import { DatabaseModule } from '../database/database.module';
import { SimpleCacheService } from '../common/services/simple-cache.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AssetController],
  providers: [
    AssetService,
    AssetQueryService,
    AssetBulkService,
    SimpleCacheService,
  ],
})
export class AssetModule {}

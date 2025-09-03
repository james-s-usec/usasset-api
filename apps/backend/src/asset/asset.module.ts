import { Module } from '@nestjs/common';
import { AssetController } from './controllers/asset.controller';
import { AssetService } from './services/asset.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AssetController],
  providers: [AssetService],
})
export class AssetModule {}

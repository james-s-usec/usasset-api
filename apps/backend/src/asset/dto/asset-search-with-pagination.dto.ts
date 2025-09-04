import { IntersectionType } from '@nestjs/swagger';
import { PaginationDto } from '../../user/dto/pagination.dto';
import { AssetSearchDto } from './asset-search.dto';

export class AssetSearchWithPaginationDto extends IntersectionType(
  PaginationDto,
  AssetSearchDto,
) {}
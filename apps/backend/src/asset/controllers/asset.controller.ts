import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AssetService } from '../services/asset.service';
import { AssetQueryService } from '../services/asset-query.service';
import { AssetBulkService } from '../services/asset-bulk.service';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { SafeAssetDto } from '../dto/safe-asset.dto';
import { AssetSearchDto } from '../dto/asset-search.dto';
import { AssetSearchWithPaginationDto } from '../dto/asset-search-with-pagination.dto';
import { BulkCreateAssetsDto } from '../dto/bulk-create-asset.dto';
import { BulkUpdateAssetsDto } from '../dto/bulk-update-asset.dto';
import { BulkDeleteAssetsDto } from '../dto/bulk-delete-asset.dto';
import { BulkOperationResult } from '../dto/bulk-operation-result.dto';
import { PaginationDto } from '../../user/dto/pagination.dto';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../../common/constants';
import { AssetNotFoundException } from '../exceptions/asset.exceptions';
import { SanitizationPipe } from '../../common/pipes/sanitization.pipe';
import { plainToInstance } from 'class-transformer';

@ApiTags('assets')
@Controller('api/assets')
export class AssetController {
  public constructor(
    private readonly assetService: AssetService,
    private readonly assetQueryService: AssetQueryService,
    private readonly assetBulkService: AssetBulkService,
  ) {}

  private convertDecimalToNumber(decimal: unknown): number | null {
    if (!decimal) return null;
    // Handle Prisma Decimal type which has toString method
    if (
      typeof decimal === 'object' &&
      decimal !== null &&
      'toString' in decimal
    ) {
      return parseFloat((decimal as { toString(): string }).toString());
    }
    // For primitive types (string, number)
    if (typeof decimal === 'string' || typeof decimal === 'number') {
      return parseFloat(String(decimal));
    }
    return null;
  }

  private convertPrismaAssetToPlain(
    asset: Record<string, unknown>,
  ): Record<string, unknown> {
    const decimalFields = [
      'xCoordinate',
      'yCoordinate',
      'squareFeet',
      'weight',
      'purchaseCost',
      'installationCost',
      'annualMaintenanceCost',
      'estimatedAnnualOperatingCost',
      'disposalCost',
      'salvageValue',
      'totalCostOfOwnership',
      'currentBookValue',
      'ratedPowerKw',
      'actualPowerKw',
      'dailyOperatingHours',
      'estimatedAnnualKwh',
    ];

    const result: Record<string, unknown> = { ...asset };

    for (const field of decimalFields) {
      result[field] = this.convertDecimalToNumber(asset[field]);
    }

    return result;
  }

  @Get()
  @ApiOperation({
    summary: 'Get all assets with search, filtering, and pagination',
  })
  @ApiResponse({ status: 200, description: 'Assets retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term across multiple fields',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'ACTIVE',
      'INACTIVE',
      'MAINTENANCE',
      'RETIRED',
      'DISPOSED',
      'LOST',
      'TRANSFERRED',
    ],
  })
  @ApiQuery({
    name: 'condition',
    required: false,
    enum: [
      'EXCELLENT',
      'GOOD',
      'FAIR',
      'POOR',
      'CRITICAL',
      'UNKNOWN',
      'NOT_APPLICABLE',
    ],
  })
  @ApiQuery({ name: 'manufacturer', required: false, type: String })
  @ApiQuery({ name: 'buildingName', required: false, type: String })
  @ApiQuery({ name: 'floor', required: false, type: String })
  @ApiQuery({ name: 'trade', required: false, type: String })
  @ApiQuery({ name: 'assetCategory', required: false, type: String })
  @ApiQuery({
    name: 'installDateFrom',
    required: false,
    type: String,
    description: 'ISO date string',
  })
  @ApiQuery({
    name: 'installDateTo',
    required: false,
    type: String,
    description: 'ISO date string',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: [
      'name',
      'assetTag',
      'manufacturer',
      'installDate',
      'purchaseDate',
      'purchaseCost',
      'created_at',
    ],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  public async findAll(
    @Query(ValidationPipe) query: AssetSearchWithPaginationDto,
  ): Promise<{ assets: SafeAssetDto[]; pagination: Record<string, number> }> {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_PAGE_SIZE,
      ...searchParams
    } = query;
    const { assets, total } = await this.assetQueryService.findManyWithSearch(
      searchParams,
      page,
      limit,
    );
    return this.formatAssetResponse(assets, { page, limit, total });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get asset summary statistics' })
  @ApiResponse({
    status: 200,
    description: 'Asset summary retrieved successfully',
  })
  public async getSummary(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byCondition: Record<string, number>;
    averageCost: number;
    totalValue: number;
  }> {
    return this.assetQueryService.getAssetSummary();
  }

  // Bulk operations endpoints
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create multiple assets in bulk' })
  @ApiResponse({
    status: 201,
    description: 'Bulk create operation completed',
    type: BulkOperationResult,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiBody({ type: BulkCreateAssetsDto })
  public async bulkCreate(
    @Body(SanitizationPipe, ValidationPipe) bulkCreateDto: BulkCreateAssetsDto,
  ): Promise<BulkOperationResult> {
    return this.assetBulkService.bulkCreate(bulkCreateDto.assets);
  }

  @Patch('bulk')
  @ApiOperation({ summary: 'Update multiple assets in bulk' })
  @ApiResponse({
    status: 200,
    description: 'Bulk update operation completed',
    type: BulkOperationResult,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiBody({ type: BulkUpdateAssetsDto })
  public async bulkUpdate(
    @Body(SanitizationPipe, ValidationPipe) bulkUpdateDto: BulkUpdateAssetsDto,
  ): Promise<BulkOperationResult> {
    return this.assetBulkService.bulkUpdate(bulkUpdateDto.assets);
  }

  @Delete('bulk')
  @ApiOperation({ summary: 'Delete multiple assets in bulk' })
  @ApiResponse({
    status: 200,
    description: 'Bulk delete operation completed',
    type: BulkOperationResult,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiBody({ type: BulkDeleteAssetsDto })
  public async bulkDelete(
    @Body(SanitizationPipe, ValidationPipe) bulkDeleteDto: BulkDeleteAssetsDto,
  ): Promise<BulkOperationResult> {
    return this.assetBulkService.bulkDelete(
      bulkDeleteDto.ids,
      bulkDeleteDto.hardDelete,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an asset by ID' })
  @ApiResponse({ status: 200, description: 'Asset found' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  public async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SafeAssetDto> {
    const asset = await this.assetService.findById(id);
    if (!asset) {
      throw new AssetNotFoundException(id);
    }
    return plainToInstance(SafeAssetDto, asset, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new asset' })
  @ApiResponse({ status: 201, description: 'Asset created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: CreateAssetDto })
  public async create(
    @Body(SanitizationPipe, ValidationPipe) createAssetDto: CreateAssetDto,
  ): Promise<SafeAssetDto> {
    const asset = await this.assetService.create(createAssetDto);
    return plainToInstance(SafeAssetDto, asset, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an asset' })
  @ApiResponse({ status: 200, description: 'Asset updated successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateAssetDto })
  public async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(SanitizationPipe, ValidationPipe) updateAssetDto: UpdateAssetDto,
  ): Promise<SafeAssetDto> {
    const asset = await this.assetService.update(id, updateAssetDto);
    return plainToInstance(SafeAssetDto, asset, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an asset (soft delete)' })
  @ApiResponse({ status: 204, description: 'Asset deleted successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  public async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.assetService.delete(id);
  }

  // Search and filtering endpoints
  @Get('search')
  @ApiOperation({ summary: 'Advanced asset search with all filter options' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  public async search(
    @Query(ValidationPipe) query: AssetSearchWithPaginationDto,
  ): Promise<{ assets: SafeAssetDto[]; pagination: Record<string, number> }> {
    return this.findAll(query);
  }

  private formatAssetResponse(
    assets: unknown[],
    paginationInfo: { page: number; limit: number; total: number },
  ): { assets: SafeAssetDto[]; pagination: Record<string, number> } {
    const plainAssets = assets.map((asset) =>
      this.convertPrismaAssetToPlain(asset as Record<string, unknown>),
    );

    const safeAssets = plainToInstance(SafeAssetDto, plainAssets, {
      excludeExtraneousValues: true,
    });

    return {
      assets: safeAssets,
      pagination: {
        page: paginationInfo.page,
        limit: paginationInfo.limit,
        total: paginationInfo.total,
        totalPages: Math.ceil(paginationInfo.total / paginationInfo.limit),
      },
    };
  }
}

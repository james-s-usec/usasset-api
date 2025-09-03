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
import { CreateAssetDto } from '../dto/create-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { SafeAssetDto } from '../dto/safe-asset.dto';
import { PaginationDto } from '../../user/dto/pagination.dto';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../../common/constants';
import { AssetNotFoundException } from '../exceptions/asset.exceptions';
import { SanitizationPipe } from '../../common/pipes/sanitization.pipe';
import { plainToInstance } from 'class-transformer';

@ApiTags('assets')
@Controller('api/assets')
export class AssetController {
  public constructor(private readonly assetService: AssetService) {}

  @Get()
  @ApiOperation({ summary: 'Get all assets with pagination' })
  @ApiResponse({ status: 200, description: 'Assets retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  public async findAll(
    @Query(ValidationPipe) pagination: PaginationDto,
  ): Promise<{ assets: SafeAssetDto[]; pagination: Record<string, number> }> {
    const { page = DEFAULT_PAGE, limit = DEFAULT_PAGE_SIZE } = pagination;

    const { assets, total } = await this.assetService.findManyPaginated(
      page,
      limit,
    );

    const safeAssets = plainToInstance(SafeAssetDto, assets, {
      excludeExtraneousValues: true,
    });

    return {
      assets: safeAssets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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
}

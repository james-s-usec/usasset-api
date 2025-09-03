import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { FolderService } from './folder.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { FolderResponseDto } from './dto/folder-response.dto';

@ApiTags('folders')
@Controller('api/folders')
export class FolderController {
  public constructor(private readonly folderService: FolderService) {}

  @Get()
  @ApiOperation({ summary: 'Get all folders with file counts' })
  @ApiResponse({
    status: 200,
    description: 'Folders retrieved successfully',
    type: [FolderResponseDto],
  })
  public async findAll(): Promise<FolderResponseDto[]> {
    return this.folderService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get folder by ID' })
  @ApiParam({ name: 'id', description: 'Folder UUID' })
  @ApiResponse({
    status: 200,
    description: 'Folder retrieved successfully',
    type: FolderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  public async findOne(@Param('id') id: string): Promise<FolderResponseDto> {
    return this.folderService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new folder' })
  @ApiResponse({
    status: 201,
    description: 'Folder created successfully',
    type: FolderResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Folder name already exists' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  public async create(
    @Body() createFolderDto: CreateFolderDto,
  ): Promise<FolderResponseDto> {
    return this.folderService.create(createFolderDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update folder by ID' })
  @ApiParam({ name: 'id', description: 'Folder UUID' })
  @ApiResponse({
    status: 200,
    description: 'Folder updated successfully',
    type: FolderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  @ApiResponse({ status: 409, description: 'Folder name already exists' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  public async update(
    @Param('id') id: string,
    @Body() updateFolderDto: UpdateFolderDto,
  ): Promise<FolderResponseDto> {
    return this.folderService.update(id, updateFolderDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete folder by ID' })
  @ApiParam({ name: 'id', description: 'Folder UUID' })
  @ApiResponse({ status: 204, description: 'Folder deleted successfully' })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete folder with files or default folders',
  })
  public async delete(@Param('id') id: string): Promise<void> {
    return this.folderService.delete(id);
  }
}

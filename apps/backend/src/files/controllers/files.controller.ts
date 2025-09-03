import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { AzureBlobStorageService } from '../services/azure-blob-storage.service';
import { FileResponseDto } from '../dto/file-response.dto';
import { MulterFile } from '../interfaces/file.interface';

@ApiTags('files')
@Controller('api/files')
export class FilesController {
  public constructor(
    private readonly storageService: AzureBlobStorageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all files with pagination' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  public async listFiles(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<{
    files: FileResponseDto[];
    pagination: { page: number; limit: number; total: number };
  }> {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const result = await this.storageService.findMany(pageNum, limitNum);
    return {
      files: result.files.map((file) => this.mapToResponseDto(file)),
      pagination: result.pagination,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Upload a file to Azure Blob Storage' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: FileResponseDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  public async uploadFile(
    @UploadedFile() file: MulterFile,
  ): Promise<FileResponseDto> {
    const uploadedFile = await this.storageService.upload(file);
    return this.mapToResponseDto(uploadedFile);
  }

  private mapToResponseDto(file: {
    id: string;
    filename: string;
    original_name: string;
    mimetype: string;
    size: number;
    created_at: Date;
  }): FileResponseDto {
    return {
      id: file.id,
      filename: file.filename,
      original_name: file.original_name,
      mimetype: file.mimetype,
      size: file.size,
      created_at: file.created_at,
    };
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get download URL for a file' })
  @ApiResponse({ status: 200, description: 'Download URL generated' })
  public async getDownloadUrl(
    @Param('id') id: string,
  ): Promise<{ url: string }> {
    const url = await this.storageService.getDownloadUrl(id);
    return { url };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file from Azure Blob Storage' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  public async deleteFile(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.storageService.delete(id);
    return { message: 'File deleted successfully' };
  }
}

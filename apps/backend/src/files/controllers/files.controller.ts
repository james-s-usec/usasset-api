import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type multer from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { AzureBlobStorageService } from '../services/azure-blob-storage.service';
import { FileResponseDto } from '../dto/file-response.dto';

@ApiTags('files')
@Controller('api/files')
export class FilesController {
  public constructor(
    private readonly storageService: AzureBlobStorageService,
  ) {}

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
    @UploadedFile() file: multer.File,
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
}

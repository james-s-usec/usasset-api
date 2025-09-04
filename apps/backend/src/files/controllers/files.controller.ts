import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AzureBlobStorageService } from '../services/azure-blob-storage.service';
import { PdfProcessingService } from '../services/pdf-processing.service';
import { FileResponseDto } from '../dto/file-response.dto';
import { MulterFile } from '../interfaces/file.interface';

const DEFAULT_PDF_PREVIEW_WIDTH = 800;

@ApiTags('files')
@Controller('api/files')
export class FilesController {
  public constructor(
    private readonly storageService: AzureBlobStorageService,
    private readonly pdfService: PdfProcessingService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List all files with pagination, optionally filtered by project',
  })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  public async listFiles(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('project_id') projectId?: string,
  ): Promise<{
    files: FileResponseDto[];
    pagination: { page: number; limit: number; total: number };
  }> {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const result = await this.storageService.findMany(
      pageNum,
      limitNum,
      projectId,
    );
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
    @Query('folder_id') folderId?: string,
    @Query('project_id') projectId?: string,
  ): Promise<FileResponseDto> {
    const uploadedFile = await this.storageService.upload(
      file,
      folderId,
      projectId,
    );
    return this.mapToResponseDto(uploadedFile);
  }

  private mapToResponseDto(file: {
    id: string;
    filename: string;
    original_name: string;
    mimetype: string;
    size: number;
    created_at: Date;
    folder?: {
      id: string;
      name: string;
      color: string | null;
    } | null;
    project?: {
      id: string;
      name: string;
    } | null;
  }): FileResponseDto {
    return {
      id: file.id,
      filename: file.filename,
      original_name: file.original_name,
      mimetype: file.mimetype,
      size: file.size,
      created_at: file.created_at,
      folder: file.folder || undefined,
      project: file.project || undefined,
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

  @Get(':id/view')
  @ApiOperation({ summary: 'Get a SAS URL for viewing/embedding an image' })
  @ApiResponse({ status: 200, description: 'SAS URL generated for image' })
  public async getImageUrl(
    @Param('id') id: string,
    @Query('expires') expires?: string,
  ): Promise<{ url: string; mimetype: string; expires_at: Date }> {
    const DEFAULT_EXPIRY = 60;
    const expiresInMinutes = expires ? parseInt(expires, 10) : DEFAULT_EXPIRY;
    const result = await this.storageService.getSecureImageUrl(
      id,
      expiresInMinutes,
    );
    return result;
  }

  @Get(':id/content')
  @ApiOperation({
    summary: 'Get file content as text (for CSV, text files, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'File content retrieved successfully',
  })
  public async getFileContent(
    @Param('id') id: string,
  ): Promise<{ content: string }> {
    const content = await this.storageService.getFileContentAsText(id);
    return { content };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update file metadata (e.g., move to folder or assign to project)',
  })
  @ApiResponse({ status: 200, description: 'File updated successfully' })
  public async updateFile(
    @Param('id') id: string,
    @Body() updateData: { folder_id?: string; project_id?: string },
  ): Promise<FileResponseDto> {
    const updatedFile = await this.storageService.updateFile(id, updateData);
    return this.mapToResponseDto(updatedFile);
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

  @Get(':id/pdf-info')
  @ApiOperation({ summary: 'Get PDF metadata (page count, dimensions, etc.)' })
  @ApiResponse({ status: 200, description: 'PDF metadata retrieved' })
  public async getPdfInfo(@Param('id') id: string): Promise<{
    pageCount: number;
    title?: string;
    author?: string;
    dimensions: { width: number; height: number };
    maxZoom: number;
    tileSize: number;
  }> {
    return await this.pdfService.getPdfInfo(id);
  }

  @Get(':id/pdf-preview/:page.png')
  @ApiOperation({ summary: 'Get full PDF page preview as PNG' })
  @ApiResponse({ status: 200, description: 'PDF page preview image' })
  public async getPdfPreview(
    @Param('id') id: string,
    @Param('page') page: string,
    @Res() res: Response,
    @Query('width') width?: string,
  ): Promise<void> {
    const pageNum = parseInt(page, 10);
    const widthNum = width ? parseInt(width, 10) : DEFAULT_PDF_PREVIEW_WIDTH;

    const imageBuffer = await this.pdfService.getPdfPreview(
      id,
      pageNum,
      widthNum,
    );

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(imageBuffer);
  }

  @Get(':id/pdf-tiles/:page/:z/:x/:y.png')
  @ApiOperation({ summary: 'Get PDF tile as PNG image' })
  @ApiResponse({ status: 200, description: 'PDF tile image' })
  public async getPdfTile(
    @Param('id') id: string,
    @Param() tileParams: { page: string; z: string; x: string; y: string },
    @Res() res: Response,
  ): Promise<void> {
    const tileCoordinates = this.parseTileCoordinates(tileParams);
    const tileBuffer = await this.pdfService.getPdfTile({
      fileId: id,
      page: tileCoordinates.page,
      zoom: tileCoordinates.z,
      x: tileCoordinates.x,
      y: tileCoordinates.y,
    });

    this.setTileResponseHeaders(res);
    res.send(tileBuffer);
  }

  private parseTileCoordinates(params: {
    page: string;
    z: string;
    x: string;
    y: string;
  }): { page: number; z: number; x: number; y: number } {
    return {
      page: parseInt(params.page, 10),
      z: parseInt(params.z, 10),
      x: parseInt(params.x, 10),
      y: parseInt(params.y, 10),
    };
  }

  private setTileResponseHeaders(res: Response): void {
    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    });
  }

  @Post('sync')
  @ApiOperation({
    summary: 'Sync Azure Blob Storage with database',
    description: 'Reconciles blob storage with database records',
  })
  @ApiResponse({ status: 200, description: 'Sync completed' })
  public async syncStorage(): Promise<{
    added: number;
    marked_deleted: number;
    already_synced: number;
  }> {
    return await this.storageService.syncBlobsWithDatabase();
  }

  @Patch('bulk/assign-project')
  @ApiOperation({
    summary: 'Bulk assign files to a project',
    description:
      'Assign multiple files to a project or remove project assignment',
  })
  @ApiResponse({
    status: 200,
    description: 'Files assigned to project successfully',
  })
  public async bulkAssignProject(
    @Body() bulkData: { file_ids: string[]; project_id: string | null },
  ): Promise<{ message: string; updated_count: number }> {
    const updatedCount = await this.storageService.bulkAssignProject(
      bulkData.file_ids,
      bulkData.project_id,
    );
    const action = bulkData.project_id
      ? 'assigned to project'
      : 'removed from project';
    return {
      message: `${updatedCount} files ${action} successfully`,
      updated_count: updatedCount,
    };
  }

  @Patch('bulk/move-to-folder')
  @ApiOperation({
    summary: 'Bulk move files to a folder',
    description: 'Move multiple files to a folder or to unorganized',
  })
  @ApiResponse({
    status: 200,
    description: 'Files moved to folder successfully',
  })
  public async bulkMoveToFolder(
    @Body() bulkData: { file_ids: string[]; folder_id: string | null },
  ): Promise<{ message: string; updated_count: number }> {
    const updatedCount = await this.storageService.bulkMoveToFolder(
      bulkData.file_ids,
      bulkData.folder_id,
    );
    const action = bulkData.folder_id
      ? 'moved to folder'
      : 'moved to unorganized';
    return {
      message: `${updatedCount} files ${action} successfully`,
      updated_count: updatedCount,
    };
  }

  @Delete('bulk/delete')
  @ApiOperation({
    summary: 'Bulk delete files',
    description: 'Delete multiple files from Azure Blob Storage and database',
  })
  @ApiResponse({ status: 200, description: 'Files deleted successfully' })
  public async bulkDelete(
    @Body() bulkData: { file_ids: string[] },
  ): Promise<{ message: string; deleted_count: number }> {
    const deletedCount = await this.storageService.bulkDelete(
      bulkData.file_ids,
    );
    return {
      message: `${deletedCount} files deleted successfully`,
      deleted_count: deletedCount,
    };
  }
}

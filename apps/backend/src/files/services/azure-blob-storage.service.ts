import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BlobServiceClient,
  ContainerClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { PrismaService } from '../../database/prisma.service';
import { File } from '@prisma/client';
import { MulterFile } from '../interfaces/file.interface';

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;

const FILE_SIZE_LIMITS = {
  IMAGE_MAX_MB: 10,
  FILE_MAX_MB: 50,
  BYTES_PER_MB,
};

const DEFAULT_EXPIRY_MINUTES = 60;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = SECONDS_PER_MINUTE * MS_PER_SECOND;

@Injectable()
export class AzureBlobStorageService {
  private readonly logger = new Logger(AzureBlobStorageService.name);
  private readonly blobServiceClient: BlobServiceClient;
  private readonly containerClient: ContainerClient;
  private readonly containerName: string;
  private storageAccountName: string = '';
  private storageAccountKey: string = '';

  public constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const connectionString = this.configService.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );
    this.containerName = this.configService.get<string>(
      'AZURE_STORAGE_CONTAINER_NAME',
      'uploads',
    );

    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is required');
    }

    this.parseStorageCredentials(connectionString);
    this.blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
  }

  private parseStorageCredentials(connectionString: string): void {
    const accountMatch = connectionString.match(/AccountName=([^;]+)/);
    const keyMatch = connectionString.match(/AccountKey=([^;]+)/);

    if (accountMatch && keyMatch) {
      this.storageAccountName = accountMatch[1];
      this.storageAccountKey = keyMatch[1];
    } else {
      this.storageAccountName = '';
      this.storageAccountKey = '';
      this.logger.warn(
        'Could not parse storage account credentials for SAS generation',
      );
    }
  }

  private validateFileSize(file: MulterFile): void {
    const isImage = file.mimetype.startsWith('image/');
    const maxSizeMB = isImage
      ? FILE_SIZE_LIMITS.IMAGE_MAX_MB
      : FILE_SIZE_LIMITS.FILE_MAX_MB;
    const maxSize = maxSizeMB * FILE_SIZE_LIMITS.BYTES_PER_MB;

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
      );
    }
  }

  private validateImageType(mimetype: string): void {
    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];

    if (!allowedImageTypes.includes(mimetype)) {
      throw new BadRequestException(
        `Invalid image type. Allowed types: ${allowedImageTypes.join(', ')}`,
      );
    }
  }

  public async upload(
    file: MulterFile,
    folderId?: string,
    projectId?: string,
  ): Promise<File> {
    this.validateFileSize(file);

    const isImage = file.mimetype.startsWith('image/');
    if (isImage) {
      this.validateImageType(file.mimetype);
    }

    const blobName = `${Date.now()}-${file.originalname}`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(file.buffer, file.size, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
        blobCacheControl: isImage ? 'public, max-age=31536000' : 'private',
      },
    });

    const fileEntity = await this.prisma.file.create({
      data: {
        filename: blobName,
        original_name: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        blob_url: blockBlobClient.url,
        container_name: this.containerName,
        blob_name: blobName,
        project_id: projectId || null,
        folder_id: folderId || null,
      },
    });

    this.logger.log(`File uploaded: ${blobName} (${file.size} bytes)`);
    return fileEntity;
  }

  public async getDownloadUrl(fileId: string): Promise<string> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId, is_deleted: false },
    });

    if (!file) {
      throw new Error(`File with ID ${fileId} not found`);
    }

    if (!this.storageAccountName || !this.storageAccountKey) {
      this.logger.warn(
        'SAS token generation not available, returning direct URL',
      );
      return file.blob_url;
    }

    const blockBlobClient = this.containerClient.getBlockBlobClient(
      file.blob_name,
    );
    const sasToken = this.generateSASToken(file, DEFAULT_EXPIRY_MINUTES, true);
    const sasUrl = `${blockBlobClient.url}?${sasToken}`;

    this.logger.log(`Generated SAS download URL for ${file.blob_name}`);
    return sasUrl;
  }

  public async findMany(
    page: number,
    limit: number,
    projectId?: string,
  ): Promise<{
    files: File[];
    pagination: { page: number; limit: number; total: number };
  }> {
    const skip = this.calculateSkip(page, limit);
    const [files, total] = await this.fetchFilesAndCount(
      skip,
      limit,
      projectId,
    );
    const pagination = this.buildPaginationResponse(page, limit, total);

    return {
      files,
      pagination,
    };
  }

  private calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  private async fetchFilesAndCount(
    skip: number,
    limit: number,
    projectId?: string,
  ): Promise<[File[], number]> {
    const whereClause = {
      is_deleted: false,
      ...(projectId && { project_id: projectId }),
    };

    return Promise.all([
      this.prisma.file.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          folder: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.file.count({
        where: whereClause,
      }),
    ]);
  }

  private buildPaginationResponse(
    page: number,
    limit: number,
    total: number,
  ): { page: number; limit: number; total: number } {
    return {
      page,
      limit,
      total,
    };
  }

  public async delete(fileId: string): Promise<void> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId, is_deleted: false },
    });

    if (!file) {
      throw new Error(`File with ID ${fileId} not found`);
    }

    const blockBlobClient = this.containerClient.getBlockBlobClient(
      file.blob_name,
    );
    await blockBlobClient.delete();

    await this.prisma.file.update({
      where: { id: fileId },
      data: { is_deleted: true, deleted_at: new Date() },
    });

    this.logger.log(`File deleted: ${file.blob_name}`);
  }

  public async getFileContentAsText(fileId: string): Promise<string> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId, is_deleted: false },
    });

    if (!file) {
      throw new BadRequestException(`File with ID ${fileId} not found`);
    }

    const blockBlobClient = this.containerClient.getBlockBlobClient(
      file.blob_name,
    );

    try {
      const downloadResponse = await blockBlobClient.download();
      if (!downloadResponse.readableStreamBody) {
        throw new BadRequestException('No readable stream available for file');
      }
      const content = await this.streamToString(
        downloadResponse.readableStreamBody,
      );
      return content;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to download file content: ${errorMessage}`);
      throw new BadRequestException('Failed to retrieve file content');
    }
  }

  public async downloadFile(blobName: string): Promise<Buffer> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    try {
      const downloadResponse = await blockBlobClient.download();
      if (!downloadResponse.readableStreamBody) {
        throw new BadRequestException('No readable stream available for file');
      }
      const buffer = await this.streamToBuffer(
        downloadResponse.readableStreamBody,
      );
      return buffer;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to download file: ${errorMessage}`);
      throw new BadRequestException('Failed to retrieve file');
    }
  }

  private async streamToString(stream: NodeJS.ReadableStream): Promise<string> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) =>
        chunks.push(Buffer.from(chunk as ArrayBuffer)),
      );
      stream.on('error', (err) =>
        reject(new Error(err instanceof Error ? err.message : String(err))),
      );
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
  }

  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) =>
        chunks.push(Buffer.from(chunk as ArrayBuffer)),
      );
      stream.on('error', (err) =>
        reject(new Error(err instanceof Error ? err.message : String(err))),
      );
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  private async validateImageFile(fileId: string): Promise<File> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId, is_deleted: false },
    });

    if (!file) {
      throw new BadRequestException(`File with ID ${fileId} not found`);
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        `File ${fileId} is not an image. Use /download endpoint for non-image files`,
      );
    }

    return file;
  }

  private generateSASToken(
    file: File,
    expiresInMinutes: number,
    forDownload: boolean = false,
  ): string {
    const sasOptions = {
      containerName: this.containerName,
      blobName: file.blob_name,
      permissions: BlobSASPermissions.parse('r'),
      startsOn: new Date(),
      expiresOn: new Date(Date.now() + expiresInMinutes * MS_PER_MINUTE),
      contentDisposition: forDownload ? 'attachment' : 'inline',
      contentType: file.mimetype,
    };

    const sharedKeyCredential = new StorageSharedKeyCredential(
      this.storageAccountName,
      this.storageAccountKey,
    );

    return generateBlobSASQueryParameters(
      sasOptions,
      sharedKeyCredential,
    ).toString();
  }

  public async getSecureImageUrl(
    fileId: string,
    expiresInMinutes: number = DEFAULT_EXPIRY_MINUTES,
  ): Promise<{ url: string; mimetype: string; expires_at: Date }> {
    const file = await this.validateImageFile(fileId);
    const expiresAt = new Date(Date.now() + expiresInMinutes * MS_PER_MINUTE);

    if (!this.storageAccountName || !this.storageAccountKey) {
      this.logger.warn(
        'SAS token generation not available, returning direct URL',
      );
      return {
        url: file.blob_url,
        mimetype: file.mimetype,
        expires_at: expiresAt,
      };
    }

    const blockBlobClient = this.containerClient.getBlockBlobClient(
      file.blob_name,
    );
    const sasToken = this.generateSASToken(file, expiresInMinutes);
    const sasUrl = `${blockBlobClient.url}?${sasToken}`;

    this.logger.log(`Generated SAS URL for image ${file.blob_name}`);

    return {
      url: sasUrl,
      mimetype: file.mimetype,
      expires_at: expiresAt,
    };
  }

  private async getAllBlobNames(): Promise<string[]> {
    const blobs: string[] = [];
    for await (const blob of this.containerClient.listBlobsFlat()) {
      blobs.push(blob.name);
    }
    return blobs;
  }

  private async addMissingBlobToDatabase(blobName: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const properties = await blockBlobClient.getProperties();
    const originalName = blobName.replace(/^\d+-/, '');

    await this.prisma.file.create({
      data: {
        filename: blobName,
        blob_name: blobName,
        original_name: originalName,
        mimetype: properties.contentType || 'application/octet-stream',
        size: properties.contentLength || 0,
        blob_url: blockBlobClient.url,
        container_name: this.containerName,
        created_at: properties.createdOn || new Date(),
      },
    });
    this.logger.log(`Added missing file to database: ${blobName}`);
  }

  // eslint-disable-next-line max-lines-per-function, max-statements
  public async syncBlobsWithDatabase(): Promise<{
    added: number;
    marked_deleted: number;
    already_synced: number;
  }> {
    this.logger.log('Starting blob storage sync...');

    const blobs = await this.getAllBlobNames();
    const dbFiles = await this.prisma.file.findMany({
      where: { is_deleted: false },
      select: { blob_name: true },
    });

    const dbBlobNames = new Set(dbFiles.map((f) => f.blob_name));
    const missingInDb = blobs.filter((blob) => !dbBlobNames.has(blob));
    const missingInAzure = Array.from(dbBlobNames).filter(
      (name) => !blobs.includes(name),
    );

    let added = 0;
    for (const blobName of missingInDb) {
      await this.addMissingBlobToDatabase(blobName);
      added++;
    }

    let markedDeleted = 0;
    if (missingInAzure.length > 0) {
      const result = await this.prisma.file.updateMany({
        where: {
          blob_name: { in: missingInAzure },
          is_deleted: false,
        },
        data: {
          is_deleted: true,
          deleted_at: new Date(),
        },
      });
      markedDeleted = result.count;
      this.logger.log(`Marked ${markedDeleted} missing blobs as deleted`);
    }

    const alreadySynced = blobs.length - missingInDb.length;
    this.logger.log(
      `Sync complete: ${added} added, ${markedDeleted} marked deleted, ${alreadySynced} already synced`,
    );

    return {
      added,
      marked_deleted: markedDeleted,
      already_synced: alreadySynced,
    };
  }

  public async updateFile(
    fileId: string,
    updateData: { folder_id?: string; project_id?: string },
  ): Promise<
    File & {
      folder?: { id: string; name: string; color: string | null };
      project?: { id: string; name: string };
    }
  > {
    // Validate folder exists if folder_id is provided
    if (updateData.folder_id) {
      const folder = await this.prisma.folder.findUnique({
        where: { id: updateData.folder_id, is_deleted: false },
      });
      if (!folder) {
        throw new BadRequestException(
          `Folder with ID ${updateData.folder_id} not found`,
        );
      }
    }

    // Validate project exists if project_id is provided
    if (updateData.project_id) {
      const project = await this.prisma.project.findUnique({
        where: { id: updateData.project_id, is_deleted: false },
      });
      if (!project) {
        throw new BadRequestException(
          `Project with ID ${updateData.project_id} not found`,
        );
      }
    }

    // Update the file
    const updatedFile = await this.prisma.file.update({
      where: { id: fileId, is_deleted: false },
      data: {
        folder_id:
          updateData.folder_id !== undefined
            ? updateData.folder_id || null
            : undefined,
        project_id:
          updateData.project_id !== undefined
            ? updateData.project_id || null
            : undefined,
        updated_at: new Date(),
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(
      `Updated file ${fileId}: folder=${updateData.folder_id || 'unchanged'}, project=${updateData.project_id || 'unchanged'}`,
    );

    // Transform null to undefined for TypeScript compatibility
    return {
      ...updatedFile,
      folder: updatedFile.folder || undefined,
      project: updatedFile.project || undefined,
    };
  }
}

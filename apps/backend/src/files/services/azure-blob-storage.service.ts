import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { PrismaService } from '../../database/prisma.service';
import { File } from '@prisma/client';
import { MulterFile } from '../interfaces/file.interface';

@Injectable()
export class AzureBlobStorageService {
  private readonly logger = new Logger(AzureBlobStorageService.name);
  private readonly blobServiceClient: BlobServiceClient;
  private readonly containerClient: ContainerClient;
  private readonly containerName: string;

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

    this.blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
  }

  public async upload(file: MulterFile): Promise<File> {
    const blobName = `${Date.now()}-${file.originalname}`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(file.buffer, file.size, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
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

    const blockBlobClient = this.containerClient.getBlockBlobClient(
      file.blob_name,
    );
    return blockBlobClient.url;
  }

  public async findMany(
    page: number,
    limit: number,
  ): Promise<{
    files: File[];
    pagination: { page: number; limit: number; total: number };
  }> {
    const skip = (page - 1) * limit;

    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where: { is_deleted: false },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.file.count({
        where: { is_deleted: false },
      }),
    ]);

    return {
      files,
      pagination: {
        page,
        limit,
        total,
      },
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
}

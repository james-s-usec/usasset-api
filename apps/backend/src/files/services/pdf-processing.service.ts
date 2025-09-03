import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AzureBlobStorageService } from './azure-blob-storage.service';
import * as pdf from 'pdf-poppler';
import sharp from 'sharp';

interface PDFInfo {
  pageCount: number;
  title?: string;
  author?: string;
  dimensions: {
    width: number;
    height: number;
  };
  maxZoom: number;
  tileSize: number;
}

@Injectable()
export class PdfProcessingService {
  private readonly logger = new Logger(PdfProcessingService.name);
  private readonly TILE_SIZE = 256;
  private readonly MAX_ZOOM = 4;

  public constructor(
    private readonly prisma: PrismaService,
    private readonly blobStorage: AzureBlobStorageService,
  ) {}

  public async getPdfInfo(fileId: string): Promise<PDFInfo> {
    const file = await this.validatePdfFile(fileId);

    try {
      // For tracer bullet, return basic info
      // In a full implementation, we'd use pdf-poppler to get actual metadata
      return {
        pageCount: 1, // Simplified for tracer bullet
        title: file.original_name,
        dimensions: {
          width: 612, // Standard PDF page width in points
          height: 792, // Standard PDF page height in points
        },
        maxZoom: this.MAX_ZOOM,
        tileSize: this.TILE_SIZE,
      };
    } catch (error) {
      this.logger.error(`Failed to get PDF info for ${fileId}: ${error}`);
      throw new BadRequestException('Failed to process PDF file');
    }
  }

  public async getPdfTile(
    fileId: string,
    page: number,
    zoom: number,
    x: number,
    y: number,
  ): Promise<Buffer> {
    const file = await this.validatePdfFile(fileId);

    try {
      // For tracer bullet: convert first page to single tile (no real tiling yet)
      if (page !== 1 || zoom !== 0 || x !== 0 || y !== 0) {
        throw new NotFoundException('Tile not found');
      }

      // Get PDF content from blob storage
      const pdfContent = await this.getPdfContentAsBuffer(fileId);

      // Convert PDF page to image using pdf-poppler
      const options = {
        format: 'jpeg' as const,
        out_dir: '/tmp',
        out_prefix: `pdf-${fileId}-page`,
        page: 1,
      };

      // This will create a temporary file, we'll clean it up after processing
      await pdf.convert(pdfContent, options);

      // For simplicity in tracer bullet, create a simple colored tile
      // In full implementation, this would process the actual PDF
      const tileBuffer = await sharp({
        create: {
          width: this.TILE_SIZE,
          height: this.TILE_SIZE,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .jpeg()
        .toBuffer();

      this.logger.log(
        `Generated tile for PDF ${fileId}: page=${page}, z=${zoom}, x=${x}, y=${y}`,
      );
      return tileBuffer;
    } catch (error) {
      this.logger.error(`Failed to generate PDF tile: ${error}`);
      throw new BadRequestException('Failed to generate PDF tile');
    }
  }

  private async validatePdfFile(fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId, is_deleted: false },
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException(
        `File ${fileId} is not a PDF. Expected application/pdf, got ${file.mimetype}`,
      );
    }

    return file;
  }

  private async getPdfContentAsBuffer(fileId: string): Promise<Buffer> {
    // Use the existing blob storage service to get file content
    const content = await this.blobStorage.getFileContentAsText(fileId);
    return Buffer.from(content, 'binary');
  }
}

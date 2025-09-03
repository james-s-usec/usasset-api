import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AzureBlobStorageService } from './azure-blob-storage.service';
import * as sharp from 'sharp';
import { renderPageAsImage, getDocumentProxy } from 'unpdf';

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
  private readonly MAX_ZOOM = 6;
  private readonly BASE_SCALE = 4; // Render at 4x base resolution to match AkitaBox quality (2550px width)
  private readonly pageCache = new Map<string, Buffer>(); // Cache rendered pages
  private readonly renderingInProgress = new Map<
    string,
    Promise<{ buffer: Buffer; width: number; height: number }>
  >(); // Prevent duplicate renders

  public constructor(
    private readonly prisma: PrismaService,
    private readonly blobStorage: AzureBlobStorageService,
  ) {
    this.logger.log(
      'PDF Processing Service initialized with UnPDF + robust error handling',
    );
  }

  public async getPdfInfo(fileId: string): Promise<PDFInfo> {
    const file = await this.validatePdfFile(fileId);

    try {
      this.logger.log(
        `📄 PDF Info Request - File: ${file.original_name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      );

      const pdfBuffer = await this.getPdfBuffer(fileId);
      const uint8Array = new Uint8Array(pdfBuffer);
      const documentProxy = await getDocumentProxy(uint8Array);

      this.logger.log(
        `📊 PDF Metadata - Pages: ${documentProxy.numPages}, Buffer Size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB`,
      );

      // Get actual dimensions by rendering first page at zoom 0
      let actualWidth = 612;
      let actualHeight = 792;

      try {
        const { width, height } = await this.getOrRenderPage(fileId, 1, 0);
        actualWidth = width;
        actualHeight = height;
        this.logger.log(
          `📐 PDF Actual Dimensions - ${actualWidth}x${actualHeight}`,
        );
      } catch (error) {
        this.logger.warn(
          `Could not get PDF dimensions, using default: ${error}`,
        );
      }

      return {
        pageCount: documentProxy.numPages,
        title: file.original_name,
        dimensions: {
          width: actualWidth,
          height: actualHeight,
        },
        maxZoom: this.MAX_ZOOM,
        tileSize: this.TILE_SIZE,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to get PDF info for ${fileId}: ${errorMessage}`,
        {
          fileId,
          error: error instanceof Error ? error.stack : error,
          fileName: file.original_name,
        },
      );
      throw new BadRequestException(
        `Failed to process PDF file: ${errorMessage}`,
      );
    }
  }

  public async getPdfPreview(
    fileId: string,
    page: number,
    width: number = 800,
  ): Promise<Buffer> {
    const file = await this.validatePdfFile(fileId);

    try {
      const pdfBuffer = await this.getPdfBuffer(fileId);
      const uint8Array = new Uint8Array(pdfBuffer);

      // Render PDF page at higher resolution for better quality
      const highResWidth = width * 2; // 2x resolution for crisp preview
      const imageArrayBuffer = await renderPageAsImage(uint8Array, page, {
        width: highResWidth,
        canvasImport: () => import('@napi-rs/canvas'),
      });

      // Convert to PNG and scale down to requested size for final output
      const imageBuffer = Buffer.from(imageArrayBuffer);
      const pngBuffer = await sharp(imageBuffer)
        .resize(width, null, { withoutEnlargement: true })
        .png()
        .toBuffer();

      this.logger.log(`Generated PDF preview for page ${page} of ${fileId}`);
      return pngBuffer;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to generate PDF preview: ${errorMessage}`, {
        fileId,
        page,
        width,
        error: error instanceof Error ? error.stack : error,
      });
      throw new BadRequestException(
        `Failed to generate PDF preview: ${errorMessage}`,
      );
    }
  }

  private async getOrRenderPage(
    fileId: string,
    page: number,
    zoom: number,
  ): Promise<{ buffer: Buffer; width: number; height: number }> {
    const cacheKey = `${fileId}_${page}_${zoom}`;

    // Check cache first
    if (this.pageCache.has(cacheKey)) {
      this.logger.log(`💾 Cache Hit - Page ${page}, Zoom ${zoom}`);
      const cachedBuffer = this.pageCache.get(cacheKey)!;

      // Get actual image dimensions from cached buffer
      const metadata = await sharp(cachedBuffer).metadata();
      return {
        buffer: cachedBuffer,
        width: metadata.width,
        height: metadata.height,
      };
    }

    // Check if already rendering
    if (this.renderingInProgress.has(cacheKey)) {
      this.logger.log(
        `⏳ Waiting for render in progress - Page ${page}, Zoom ${zoom}`,
      );
      return await this.renderingInProgress.get(cacheKey)!;
    }

    // Start rendering
    this.logger.log(`🔄 Cache Miss - Rendering page ${page}, zoom ${zoom}`);

    const renderPromise = this.doRenderPage(fileId, page, zoom, cacheKey);
    this.renderingInProgress.set(cacheKey, renderPromise);

    try {
      const result = await renderPromise;
      return result;
    } finally {
      // Clean up the in-progress tracking
      this.renderingInProgress.delete(cacheKey);
    }
  }

  private async doRenderPage(
    fileId: string,
    page: number,
    zoom: number,
    cacheKey: string,
  ): Promise<{ buffer: Buffer; width: number; height: number }> {
    const pdfBuffer = await this.getPdfBuffer(fileId);
    const uint8Array = new Uint8Array(pdfBuffer);

    const scale = Math.pow(2, zoom) * this.BASE_SCALE;
    const baseWidth = 612 * scale;
    const baseHeight = 792 * scale;

    const renderStart = Date.now();

    try {
      const imageArrayBuffer = await renderPageAsImage(uint8Array, page, {
        width: baseWidth,
        height: baseHeight,
        canvasImport: () => import('@napi-rs/canvas'),
      });

      const renderTime = Date.now() - renderStart;
      const imageBuffer = Buffer.from(imageArrayBuffer);

      // Get actual dimensions from rendered image
      const metadata = await sharp(imageBuffer).metadata();
      const actualWidth = metadata.width;
      const actualHeight = metadata.height;

      this.pageCache.set(cacheKey, imageBuffer);

      this.logger.log(
        `⚡ Rendered & Cached - ${renderTime}ms, ${(imageBuffer.length / 1024).toFixed(0)}KB, Actual: ${actualWidth}x${actualHeight}`,
      );

      return {
        buffer: imageBuffer,
        width: actualWidth,
        height: actualHeight,
      };
    } catch (unpdfError: any) {
      // Handle specific UnPDF errors with proper fallback
      if (
        unpdfError.message?.includes('Missing field') ||
        unpdfError.message?.includes('beginGroup')
      ) {
        this.logger.warn(
          `UnPDF render failed for page ${page}, error: ${unpdfError.message}`,
        );

        // Create a proper error tile with the page number indicated
        const errorBuffer = await sharp({
          create: {
            width: baseWidth,
            height: baseHeight,
            channels: 3,
            background: { r: 248, g: 249, b: 250 }, // Light gray background
          },
        })
          .composite([
            {
              input: Buffer.from(
                `<svg width="${baseWidth}" height="${baseHeight}"><text x="50%" y="50%" text-anchor="middle" font-size="24" fill="#666">Page ${page} - Rendering Error</text></svg>`,
              ),
              top: 0,
              left: 0,
            },
          ])
          .png()
          .toBuffer();

        this.pageCache.set(cacheKey, errorBuffer);

        this.logger.log(
          `🚫 Error Fallback Created - Page ${page}, Zoom ${zoom}`,
        );

        return {
          buffer: errorBuffer,
          width: baseWidth,
          height: baseHeight,
        };
      }

      // Re-throw other errors
      throw unpdfError;
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
      const startTime = Date.now();
      this.logger.log(
        `🎯 Tile Request - Page: ${page}, Zoom: ${zoom}, Coords: [${x}, ${y}]`,
      );

      // Get cached or render page
      const {
        buffer: imageBuffer,
        width: fullWidth,
        height: fullHeight,
      } = await this.getOrRenderPage(fileId, page, zoom);

      // Calculate tile boundaries
      const tileX = x * this.TILE_SIZE;
      const tileY = y * this.TILE_SIZE;

      // Check if tile is completely outside image bounds
      if (tileX >= fullWidth || tileY >= fullHeight) {
        this.logger.warn(
          `🚫 Tile completely out of bounds - Tile: [${tileX}, ${tileY}], Image: [${fullWidth}, ${fullHeight}]`,
        );

        // Return blank white tile for out-of-bounds requests
        const blankTile = await sharp({
          create: {
            width: this.TILE_SIZE,
            height: this.TILE_SIZE,
            channels: 3,
            background: { r: 255, g: 255, b: 255 },
          },
        })
          .png()
          .toBuffer();

        this.logger.log(
          `✅ Blank Tile Generated - ${zoom}/${x}/${y}, Size: ${(blankTile.length / 1024).toFixed(0)}KB`,
        );
        return blankTile;
      }

      // Calculate actual extract dimensions with strict bounds checking
      const extractWidth = Math.min(
        this.TILE_SIZE,
        Math.max(0, fullWidth - tileX),
      );
      const extractHeight = Math.min(
        this.TILE_SIZE,
        Math.max(0, fullHeight - tileY),
      );

      // Double-check we have valid extraction area
      if (extractWidth <= 0 || extractHeight <= 0) {
        this.logger.warn(
          `🚫 Invalid extract dimensions - Width: ${extractWidth}, Height: ${extractHeight}`,
        );

        // Return blank white tile
        const blankTile = await sharp({
          create: {
            width: this.TILE_SIZE,
            height: this.TILE_SIZE,
            channels: 3,
            background: { r: 255, g: 255, b: 255 },
          },
        })
          .png()
          .toBuffer();

        return blankTile;
      }

      this.logger.log(
        `✂️ Tile Extract - From: [${tileX}, ${tileY}], Size: ${extractWidth}x${extractHeight}, Image: ${fullWidth}x${fullHeight}`,
      );

      // Crop the specific tile from the full page image
      let tileImage = sharp(imageBuffer).extract({
        left: tileX,
        top: tileY,
        width: extractWidth,
        height: extractHeight,
      });

      // If edge tile is smaller than TILE_SIZE, extend with white background
      if (extractWidth < this.TILE_SIZE || extractHeight < this.TILE_SIZE) {
        tileImage = tileImage.extend({
          top: 0,
          bottom: this.TILE_SIZE - extractHeight,
          left: 0,
          right: this.TILE_SIZE - extractWidth,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        });
      }

      const tileBuffer = await tileImage.png().toBuffer();

      const totalTime = Date.now() - startTime;
      this.logger.log(
        `✅ Tile Complete - ${zoom}/${x}/${y}, Total: ${totalTime}ms, Size: ${(tileBuffer.length / 1024).toFixed(0)}KB`,
      );

      return tileBuffer;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to generate PDF tile: ${errorMessage}`, {
        fileId,
        page,
        zoom,
        x,
        y,
        error: error instanceof Error ? error.stack : error,
      });
      throw new BadRequestException(
        `Failed to generate PDF tile: ${errorMessage}`,
      );
    }
  }

  private async getPdfBuffer(fileId: string): Promise<Buffer> {
    const file = await this.validatePdfFile(fileId);

    try {
      const fileBuffer = await this.blobStorage.downloadFile(file.blob_name);
      return fileBuffer;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to download PDF from blob storage: ${errorMessage}`,
        {
          fileId,
          blobName: file.blob_name,
          error: error instanceof Error ? error.stack : error,
        },
      );
      throw new BadRequestException(
        `Failed to retrieve PDF file: ${errorMessage}`,
      );
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
}

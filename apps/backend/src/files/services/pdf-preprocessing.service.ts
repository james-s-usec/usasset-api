import { Injectable, Logger } from '@nestjs/common';
import { PdfProcessingService } from './pdf-processing.service';
import { AzureBlobStorageService } from './azure-blob-storage.service';
import * as path from 'path';

@Injectable()
export class PdfPreprocessingService {
  private readonly logger = new Logger(PdfPreprocessingService.name);

  constructor(
    private readonly pdfProcessor: PdfProcessingService,
    private readonly blobStorage: AzureBlobStorageService,
  ) {}

  /**
   * Pre-generate all tiles for a PDF when uploaded
   * Runs in background after upload completes
   */
  public async preprocessPdfTiles(fileId: string): Promise<void> {
    this.logger.log(`🔄 Starting PDF preprocessing for ${fileId}`);

    try {
      // Get PDF info to determine page count and dimensions
      const pdfInfo = await this.pdfProcessor.getPdfInfo(fileId);
      const startTime = Date.now();
      let tilesGenerated = 0;

      // Generate tiles for all pages at all zoom levels
      for (let page = 1; page <= pdfInfo.pageCount; page++) {
        for (let zoom = 0; zoom <= pdfInfo.maxZoom; zoom++) {
          const tilesAtZoom = await this.generateTilesForPageZoom(
            fileId,
            page,
            zoom,
            pdfInfo,
          );
          tilesGenerated += tilesAtZoom;
        }
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ PDF preprocessing complete for ${fileId}: ` +
          `${tilesGenerated} tiles in ${processingTime}ms ` +
          `(${(processingTime / tilesGenerated).toFixed(0)}ms per tile)`,
      );
    } catch (error) {
      this.logger.error(`❌ PDF preprocessing failed for ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Generate all tiles for a specific page/zoom combination
   */
  private async generateTilesForPageZoom(
    fileId: string,
    page: number,
    zoom: number,
    pdfInfo: any,
  ): Promise<number> {
    // Calculate how many tiles needed for this zoom level
    const scale = Math.pow(2, zoom);
    const pageWidth = pdfInfo.dimensions.width * scale;
    const pageHeight = pdfInfo.dimensions.height * scale;

    const tilesX = Math.ceil(pageWidth / pdfInfo.tileSize);
    const tilesY = Math.ceil(pageHeight / pdfInfo.tileSize);

    let tilesGenerated = 0;

    // Generate each tile and store in blob storage
    for (let x = 0; x < tilesX; x++) {
      for (let y = 0; y < tilesY; y++) {
        const tileBuffer = await this.pdfProcessor.getPdfTile(
          fileId,
          page,
          zoom,
          x,
          y,
        );

        // Store tile in blob storage with predictable path
        const tileBlobName = `tiles/${fileId}/${page}/${zoom}/${x}/${y}.png`;
        await this.uploadTileToBlob(tileBlobName, tileBuffer);

        tilesGenerated++;
      }
    }

    this.logger.log(
      `📊 Generated ${tilesGenerated} tiles for page ${page} zoom ${zoom}`,
    );
    return tilesGenerated;
  }

  /**
   * Check if tiles exist for a PDF (for fast serving)
   */
  public async tilesExist(
    fileId: string,
    page: number,
    zoom: number,
    x: number,
    y: number,
  ): Promise<boolean> {
    const tileBlobName = `tiles/${fileId}/${page}/${zoom}/${x}/${y}.png`;
    return await this.checkBlobExists(tileBlobName);
  }

  /**
   * Get pre-generated tile from blob storage
   */
  public async getPreGeneratedTile(
    fileId: string,
    page: number,
    zoom: number,
    x: number,
    y: number,
  ): Promise<Buffer> {
    const tileBlobName = `tiles/${fileId}/${page}/${zoom}/${x}/${y}.png`;
    return await this.blobStorage.downloadFile(tileBlobName);
  }

  /**
   * Store a tile buffer to Azure Blob Storage
   */
  private async uploadTileToBlob(
    blobName: string,
    buffer: Buffer,
  ): Promise<void> {
    try {
      // Access the blob client directly (we'll need to expose this)
      const blockBlobClient = (
        this.blobStorage as any
      ).containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: 'image/png',
          blobCacheControl: 'public, max-age=31536000', // 1 year cache
        },
      });

      this.logger.debug(`📁 Uploaded tile: ${blobName}`);
    } catch (error) {
      this.logger.error(`Failed to upload tile ${blobName}:`, error);
      throw error;
    }
  }

  /**
   * Check if a blob exists in Azure Storage
   */
  private async checkBlobExists(blobName: string): Promise<boolean> {
    try {
      const blockBlobClient = (
        this.blobStorage as any
      ).containerClient.getBlockBlobClient(blobName);
      const response = await blockBlobClient.exists();
      return response;
    } catch (error) {
      this.logger.debug(`Blob does not exist: ${blobName}`);
      return false;
    }
  }

  /**
   * Store tile asynchronously (fire and forget for optimization)
   */
  public storeTileAsync(
    fileId: string,
    page: number,
    zoom: number,
    x: number,
    y: number,
    tileBuffer: Buffer,
  ): void {
    const tileBlobName = `tiles/${fileId}/${page}/${zoom}/${x}/${y}.png`;

    // Fire and forget - don't wait for upload
    this.uploadTileToBlob(tileBlobName, tileBuffer).catch((error) => {
      this.logger.error(
        `Background tile upload failed for ${tileBlobName}:`,
        error,
      );
    });
  }
}

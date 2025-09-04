import { Injectable, Logger } from '@nestjs/common';
import { PdfProcessingService } from './pdf-processing.service';
import { AzureBlobStorageService } from './azure-blob-storage.service';

@Injectable()
export class PdfPreprocessingService {
  private readonly logger = new Logger(PdfPreprocessingService.name);

  public constructor(
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
    pdfInfo: {
      dimensions: { width: number; height: number };
      tileSize: number;
    },
  ): Promise<number> {
    const tileCounts = this.calculateTileCount(pdfInfo, zoom);
    const tilesGenerated = await this.generateAllTiles(
      fileId,
      page,
      zoom,
      tileCounts,
    );

    this.logger.log(
      `📊 Generated ${tilesGenerated} tiles for page ${page} zoom ${zoom}`,
    );
    return tilesGenerated;
  }

  private calculateTileCount(
    pdfInfo: {
      dimensions: { width: number; height: number };
      tileSize: number;
    },
    zoom: number,
  ): { x: number; y: number } {
    const ZOOM_BASE = 2;
    const scale = Math.pow(ZOOM_BASE, zoom);
    const pageWidth = pdfInfo.dimensions.width * scale;
    const pageHeight = pdfInfo.dimensions.height * scale;

    return {
      x: Math.ceil(pageWidth / pdfInfo.tileSize),
      y: Math.ceil(pageHeight / pdfInfo.tileSize),
    };
  }

  private async generateAllTiles(
    fileId: string,
    page: number,
    zoom: number,
    tileCounts: { x: number; y: number },
  ): Promise<number> {
    let tilesGenerated = 0;

    for (let x = 0; x < tileCounts.x; x++) {
      for (let y = 0; y < tileCounts.y; y++) {
        await this.generateSingleTile({ fileId, page, zoom, x, y });
        tilesGenerated++;
      }
    }

    return tilesGenerated;
  }

  private async generateSingleTile(params: {
    fileId: string;
    page: number;
    zoom: number;
    x: number;
    y: number;
  }): Promise<void> {
    const { fileId, page, zoom, x, y } = params;
    const tileBuffer = await this.pdfProcessor.getPdfTile({
      fileId,
      page,
      zoom,
      x,
      y,
    });

    const tileBlobName = `tiles/${fileId}/${page}/${zoom}/${x}/${y}.png`;
    await this.uploadTileToBlob(tileBlobName, tileBuffer);
  }

  /**
   * Check if tiles exist for a PDF (for fast serving)
   */
  public async tilesExist(tile: {
    fileId: string;
    page: number;
    zoom: number;
    x: number;
    y: number;
  }): Promise<boolean> {
    const tileBlobName = `tiles/${tile.fileId}/${tile.page}/${tile.zoom}/${tile.x}/${tile.y}.png`;
    return await this.checkBlobExists(tileBlobName);
  }

  /**
   * Get pre-generated tile from blob storage
   */
  public async getPreGeneratedTile(tile: {
    fileId: string;
    page: number;
    zoom: number;
    x: number;
    y: number;
  }): Promise<Buffer> {
    const tileBlobName = `tiles/${tile.fileId}/${tile.page}/${tile.zoom}/${tile.x}/${tile.y}.png`;
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
      await this.blobStorage.uploadBuffer(
        blobName,
        buffer,
        'image/png',
        'public, max-age=31536000', // 1 year cache
      );
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
    const exists = await this.blobStorage.blobExists(blobName);
    if (!exists) {
      this.logger.debug(`Blob does not exist: ${blobName}`);
    }
    return exists;
  }

  /**
   * Store tile asynchronously (fire and forget for optimization)
   */
  public storeTileAsync(
    tile: { fileId: string; page: number; zoom: number; x: number; y: number },
    tileBuffer: Buffer,
  ): void {
    const tileBlobName = `tiles/${tile.fileId}/${tile.page}/${tile.zoom}/${tile.x}/${tile.y}.png`;

    // Fire and forget - don't wait for upload
    this.uploadTileToBlob(tileBlobName, tileBuffer).catch((error) => {
      this.logger.error(
        `Background tile upload failed for ${tileBlobName}:`,
        error,
      );
    });
  }
}

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AzureBlobStorageService } from './azure-blob-storage.service';
import { File } from '@prisma/client';
import * as sharp from 'sharp';
import { renderPageAsImage, getDocumentProxy } from 'unpdf';
import { FileNotFoundException } from '../exceptions/file.exceptions';

const VALIDATION_IMAGE_WIDTH = 200;

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

const TILE_SIZE = 256;
const ZOOM_BASE = 2;
const MAX_ZOOM = 6;
const BASE_SCALE = 4; // Render at 4x base resolution to match AkitaBox quality (2550px width)
const BYTES_PER_KB = 1024;
const SCALE_FACTOR = 2;
const DEFAULT_PDF_WIDTH = 612;
const DEFAULT_PDF_HEIGHT = 792;
const DEFAULT_PREVIEW_WIDTH = 800;
const DEFAULT_PAGE_IMAGE_WIDTH = 2048;
const A4_ASPECT_RATIO = 1.414;

@Injectable()
export class PdfProcessingService {
  private readonly logger = new Logger(PdfProcessingService.name);
  private readonly BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;
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
      this.logPdfInfoRequest(file);
      const documentProxy = await this.getDocumentProxy(fileId);
      const dimensions = await this.getPdfDimensions(fileId);

      return this.buildPdfInfo(documentProxy, file, dimensions);
    } catch (error) {
      this.handlePdfInfoError(error, fileId, file.original_name);
      throw new BadRequestException(
        `Failed to process PDF file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private logPdfInfoRequest(file: File): void {
    this.logger.log(
      `📄 PDF Info Request - File: ${file.original_name}, Size: ${(file.size / this.BYTES_PER_MB).toFixed(SCALE_FACTOR)}MB`,
    );
  }

  private async getDocumentProxy(
    fileId: string,
  ): Promise<{ numPages: number }> {
    const pdfBuffer = await this.getPdfBuffer(fileId);
    const uint8Array = new Uint8Array(pdfBuffer);
    const documentProxy = await getDocumentProxy(uint8Array);

    this.logger.log(
      `📊 PDF Metadata - Pages: ${documentProxy.numPages}, Buffer Size: ${(pdfBuffer.length / this.BYTES_PER_MB).toFixed(SCALE_FACTOR)}MB`,
    );

    return documentProxy as { numPages: number };
  }

  private async getPdfDimensions(
    fileId: string,
  ): Promise<{ width: number; height: number }> {
    try {
      const { width, height } = await this.getOrRenderPage(fileId, 1, 0);
      this.logger.log(`📐 PDF Actual Dimensions - ${width}x${height}`);
      return { width, height };
    } catch (error) {
      this.logger.warn(
        `Could not get PDF dimensions, using default: ${String(error)}`,
      );
      return { width: DEFAULT_PDF_WIDTH, height: DEFAULT_PDF_HEIGHT };
    }
  }

  private buildPdfInfo(
    documentProxy: unknown,
    file: File,
    dimensions: { width: number; height: number },
  ): PDFInfo {
    const pageCount = (documentProxy as { numPages: number }).numPages;
    return {
      pageCount,
      title: file.original_name,
      dimensions,
      maxZoom: MAX_ZOOM,
      tileSize: TILE_SIZE,
    };
  }

  private handlePdfInfoError(
    error: unknown,
    fileId: string,
    fileName: string,
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger.error(`Failed to get PDF info for ${fileId}: ${errorMessage}`, {
      fileId,
      error: error instanceof Error ? error.stack : error,
      fileName,
    });
  }

  public async getPdfPreview(
    fileId: string,
    page: number,
    width: number = DEFAULT_PREVIEW_WIDTH,
  ): Promise<Buffer> {
    await this.validatePdfFile(fileId);

    try {
      const imageBuffer = await this.renderPreviewImage(fileId, page, width);
      const pngBuffer = await this.processPreviewImage(imageBuffer, width);

      this.logger.log(`Generated PDF preview for page ${page} of ${fileId}`);
      return pngBuffer;
    } catch (error) {
      this.handlePreviewError(error, fileId, page, width);
      throw new BadRequestException(
        `Failed to generate PDF preview: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  public async validatePdfPages(fileId: string): Promise<{
    totalPages: number;
    validPages: number[];
    invalidPages: Array<{ page: number; error: string }>;
  }> {
    const file = await this.validatePdfFile(fileId);
    const pdfInfo = await this.getPdfInfo(fileId);

    this.logValidationStart(pdfInfo.pageCount, file.original_name);

    const { validPages, invalidPages } = await this.validateAllPages(
      fileId,
      pdfInfo.pageCount,
    );

    this.logValidationComplete(validPages.length, invalidPages.length);

    return {
      totalPages: pdfInfo.pageCount,
      validPages,
      invalidPages,
    };
  }

  private logValidationStart(pageCount: number, fileName: string): void {
    this.logger.log(`🔍 Validating ${pageCount} pages for ${fileName}`);
  }

  private logValidationComplete(
    validCount: number,
    invalidCount: number,
  ): void {
    this.logger.log(
      `✅ PDF Validation Complete - Valid: ${validCount}, Invalid: ${invalidCount}`,
    );
  }

  private async validateAllPages(
    fileId: string,
    pageCount: number,
  ): Promise<{
    validPages: number[];
    invalidPages: Array<{ page: number; error: string }>;
  }> {
    const validPages: number[] = [];
    const invalidPages: Array<{ page: number; error: string }> = [];

    for (let page = 1; page <= pageCount; page++) {
      const result = await this.validateSinglePage(fileId, page);
      if (result.valid) {
        validPages.push(page);
      } else {
        invalidPages.push({ page, error: result.error });
      }
    }

    return { validPages, invalidPages };
  }

  private async validateSinglePage(
    fileId: string,
    page: number,
  ): Promise<{ valid: boolean; error: string }> {
    try {
      await this.renderPreviewImage(fileId, page, VALIDATION_IMAGE_WIDTH);
      return { valid: true, error: '' };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (this.isKnownPdfParsingError(errorMessage)) {
        this.logger.warn(`📄 Page ${page} validation failed: ${errorMessage}`);
        return { valid: false, error: 'PDF parsing error - complex elements' };
      }

      this.logger.error(`📄 Page ${page} validation error: ${errorMessage}`);
      return { valid: false, error: errorMessage };
    }
  }

  public async getPdfPageImage(params: {
    fileId: string;
    page: number;
    width?: number;
  }): Promise<Buffer> {
    const { fileId, page, width = DEFAULT_PAGE_IMAGE_WIDTH } = params;
    await this.validatePdfFile(fileId);

    try {
      const imageBuffer = await this.renderPreviewImage(fileId, page, width);
      const pngBuffer = await this.processPreviewImage(imageBuffer, width);
      this.logSuccessfulPageGeneration(fileId, page, width);
      return pngBuffer;
    } catch (error) {
      return this.handlePageImageError(error, fileId, page, width);
    }
  }

  private async renderPreviewImage(
    fileId: string,
    page: number,
    width: number,
  ): Promise<Buffer> {
    const pdfBuffer = await this.getPdfBuffer(fileId);
    const uint8Array = new Uint8Array(pdfBuffer);
    const highResWidth = width * SCALE_FACTOR;

    const imageArrayBuffer = await renderPageAsImage(uint8Array, page, {
      width: highResWidth,
      canvasImport: () => import('@napi-rs/canvas'),
    });

    return Buffer.from(imageArrayBuffer);
  }

  private async processPreviewImage(
    imageBuffer: Buffer,
    width: number,
  ): Promise<Buffer> {
    return sharp(imageBuffer)
      .resize(width, null, { withoutEnlargement: true })
      .png()
      .toBuffer();
  }

  private logSuccessfulPageGeneration(
    fileId: string,
    page: number,
    width: number,
  ): void {
    this.logger.log(
      `Generated PDF page image for page ${page} of ${fileId} at ${width}px`,
    );
  }

  private async handlePageImageError(
    error: unknown,
    fileId: string,
    page: number,
    width: number,
  ): Promise<Buffer> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (this.isKnownPdfParsingError(errorMessage)) {
      this.logger.warn(
        `UnPDF render failed for page ${page}, creating fallback image: ${errorMessage}`,
      );
      return this.createErrorFallbackPageImage(page, width);
    }

    this.handlePreviewError(error, fileId, page, width);
    throw new BadRequestException(
      `Failed to generate PDF page image: ${errorMessage}`,
    );
  }

  private isKnownPdfParsingError(errorMessage: string): boolean {
    return (
      errorMessage.includes('Missing field') ||
      errorMessage.includes('beginGroup')
    );
  }

  private generateErrorSvgContent(
    page: number,
    width: number,
    height: number,
  ): string {
    return `<svg width="${width}" height="${height}">
            <text x="50%" y="40%" text-anchor="middle" font-size="48" fill="#666">
              Page ${page}
            </text>
            <text x="50%" y="55%" text-anchor="middle" font-size="24" fill="#999">
              Rendering Error
            </text>
            <text x="50%" y="65%" text-anchor="middle" font-size="18" fill="#999">
              This page contains complex elements that couldn't be rendered
            </text>
          </svg>`;
  }

  private handlePreviewError(
    error: unknown,
    fileId: string,
    page: number,
    width: number,
  ): void {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`Failed to generate PDF preview: ${errorMessage}`, {
      fileId,
      page,
      width,
      error: error instanceof Error ? error.stack : error,
    });
  }

  private async getOrRenderPage(
    fileId: string,
    page: number,
    zoom: number,
  ): Promise<{ buffer: Buffer; width: number; height: number }> {
    const cacheKey = `${fileId}_${page}_${zoom}`;

    // Check cache first
    const cachedResult = await this.getFromCache(cacheKey, page, zoom);
    if (cachedResult) {
      return cachedResult;
    }

    // Check if already rendering
    const inProgressResult = await this.getFromInProgressRender(
      cacheKey,
      page,
      zoom,
    );
    if (inProgressResult) {
      return inProgressResult;
    }

    // Start rendering
    return await this.startNewRender(fileId, page, zoom, cacheKey);
  }

  private async getFromCache(
    cacheKey: string,
    page: number,
    zoom: number,
  ): Promise<{ buffer: Buffer; width: number; height: number } | null> {
    if (!this.pageCache.has(cacheKey)) {
      return null;
    }

    this.logger.log(`💾 Cache Hit - Page ${page}, Zoom ${zoom}`);
    const cachedBuffer = this.pageCache.get(cacheKey)!;
    const metadata = await sharp(cachedBuffer).metadata();

    return {
      buffer: cachedBuffer,
      width: metadata.width,
      height: metadata.height,
    };
  }

  private async getFromInProgressRender(
    cacheKey: string,
    page: number,
    zoom: number,
  ): Promise<{ buffer: Buffer; width: number; height: number } | null> {
    if (!this.renderingInProgress.has(cacheKey)) {
      return null;
    }

    this.logger.log(
      `⏳ Waiting for render in progress - Page ${page}, Zoom ${zoom}`,
    );
    return await this.renderingInProgress.get(cacheKey)!;
  }

  private async startNewRender(
    fileId: string,
    page: number,
    zoom: number,
    cacheKey: string,
  ): Promise<{ buffer: Buffer; width: number; height: number }> {
    this.logger.log(`🔄 Cache Miss - Rendering page ${page}, zoom ${zoom}`);
    const renderPromise = this.doRenderPage(fileId, page, zoom, cacheKey);
    this.renderingInProgress.set(cacheKey, renderPromise);

    try {
      return await renderPromise;
    } finally {
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
    const renderDimensions = this.calculateRenderDimensions(zoom);

    try {
      return await this.performPdfRender(
        pdfBuffer,
        page,
        renderDimensions,
        cacheKey,
      );
    } catch (unpdfError: unknown) {
      return this.handleRenderError({
        unpdfError,
        page,
        zoom,
        dimensions: renderDimensions,
        cacheKey,
      });
    }
  }

  private calculateRenderDimensions(zoom: number): {
    width: number;
    height: number;
  } {
    const scale = Math.pow(ZOOM_BASE, zoom) * BASE_SCALE;
    return {
      width: DEFAULT_PDF_WIDTH * scale,
      height: DEFAULT_PDF_HEIGHT * scale,
    };
  }

  private async performPdfRender(
    pdfBuffer: Buffer,
    page: number,
    dimensions: { width: number; height: number },
    cacheKey: string,
  ): Promise<{ buffer: Buffer; width: number; height: number }> {
    const uint8Array = new Uint8Array(pdfBuffer);
    const renderStart = Date.now();

    const imageArrayBuffer = await renderPageAsImage(uint8Array, page, {
      width: dimensions.width,
      height: dimensions.height,
      canvasImport: () => import('@napi-rs/canvas'),
    });

    const renderTime = Date.now() - renderStart;
    const imageBuffer = Buffer.from(imageArrayBuffer);
    const metadata = await sharp(imageBuffer).metadata();

    this.pageCache.set(cacheKey, imageBuffer);
    this.logRenderSuccess(
      renderTime,
      imageBuffer,
      metadata.width,
      metadata.height,
    );

    return {
      buffer: imageBuffer,
      width: metadata.width,
      height: metadata.height,
    };
  }

  private logRenderSuccess(
    renderTime: number,
    imageBuffer: Buffer,
    width: number | undefined,
    height: number | undefined,
  ): void {
    this.logger.log(
      `⚡ Rendered & Cached - ${renderTime}ms, ${(imageBuffer.length / BYTES_PER_KB).toFixed(0)}KB, Actual: ${width}x${height}`,
    );
  }

  private async handleRenderError(params: {
    unpdfError: unknown;
    page: number;
    zoom: number;
    dimensions: { width: number; height: number };
    cacheKey: string;
  }): Promise<{ buffer: Buffer; width: number; height: number }> {
    const { unpdfError, page, zoom, dimensions, cacheKey } = params;
    const errorMessage =
      unpdfError instanceof Error ? unpdfError.message : String(unpdfError);

    if (
      errorMessage.includes('Missing field') ||
      errorMessage.includes('beginGroup')
    ) {
      this.logger.warn(
        `UnPDF render failed for page ${page}, error: ${errorMessage}`,
      );
      return this.createErrorFallbackTile(page, zoom, dimensions, cacheKey);
    }

    throw unpdfError;
  }

  private async createErrorFallbackTile(
    page: number,
    zoom: number,
    dimensions: { width: number; height: number },
    cacheKey: string,
  ): Promise<{ buffer: Buffer; width: number; height: number }> {
    const errorBuffer = await this.generateErrorTileBuffer(page, dimensions);
    this.cacheErrorTile(cacheKey, errorBuffer, page, zoom);

    return {
      buffer: errorBuffer,
      width: dimensions.width,
      height: dimensions.height,
    };
  }

  private async generateErrorTileBuffer(
    page: number,
    dimensions: { width: number; height: number },
  ): Promise<Buffer> {
    return sharp({
      create: {
        width: dimensions.width,
        height: dimensions.height,
        channels: 3,
        background: { r: 248, g: 249, b: 250 },
      },
    })
      .composite([this.createErrorOverlay(page, dimensions)])
      .png()
      .toBuffer();
  }

  private createErrorOverlay(
    page: number,
    dimensions: { width: number; height: number },
  ): { input: Buffer; top: number; left: number } {
    return {
      input: Buffer.from(
        `<svg width="${dimensions.width}" height="${dimensions.height}"><text x="50%" y="50%" text-anchor="middle" font-size="24" fill="#666">Page ${page} - Rendering Error</text></svg>`,
      ),
      top: 0,
      left: 0,
    };
  }

  private cacheErrorTile(
    cacheKey: string,
    errorBuffer: Buffer,
    page: number,
    zoom: number,
  ): void {
    this.pageCache.set(cacheKey, errorBuffer);
    this.logger.log(`🚫 Error Fallback Created - Page ${page}, Zoom ${zoom}`);
  }

  private async createErrorFallbackPageImage(
    page: number,
    width: number,
  ): Promise<Buffer> {
    const height = Math.floor(width * A4_ASPECT_RATIO);
    const svgContent = this.generateErrorSvgContent(page, width, height);

    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 248, g: 249, b: 250 },
      },
    })
      .composite([
        {
          input: Buffer.from(svgContent),
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toBuffer();
  }

  public async getPdfTile(params: {
    fileId: string;
    page: number;
    zoom: number;
    x: number;
    y: number;
  }): Promise<Buffer> {
    const { fileId, page, zoom, x, y } = params;
    await this.validatePdfFile(fileId);

    try {
      const startTime = Date.now();
      this.logTileRequest(page, zoom, x, y);

      const renderedPage = await this.getOrRenderPage(fileId, page, zoom);
      const tileBuffer = await this.processTile({
        renderedPage,
        zoom,
        x,
        y,
      });

      this.logTileCompletion({ zoom, x, y, startTime, tileBuffer });
      return tileBuffer;
    } catch (error) {
      this.handleTileError({ error, fileId, page, zoom, x, y });
      throw new BadRequestException(
        `Failed to generate PDF tile: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private logTileRequest(
    page: number,
    zoom: number,
    x: number,
    y: number,
  ): void {
    this.logger.log(
      `🎯 Tile Request - Page: ${page}, Zoom: ${zoom}, Coords: [${x}, ${y}]`,
    );
  }

  private async processTile(params: {
    renderedPage: { buffer: Buffer; width: number; height: number };
    zoom: number;
    x: number;
    y: number;
  }): Promise<Buffer> {
    const { renderedPage, zoom, x, y } = params;
    const tileCoords = this.calculateTileCoordinates(x, y);

    return this.extractTileFromRenderedPage({
      renderedPage,
      tileCoords,
      zoom,
      x,
      y,
    });
  }

  private async extractTileFromRenderedPage(params: {
    renderedPage: { buffer: Buffer; width: number; height: number };
    tileCoords: { x: number; y: number };
    zoom: number;
    x: number;
    y: number;
  }): Promise<Buffer> {
    if (
      this.isTileOutOfBounds(
        params.tileCoords,
        params.renderedPage.width,
        params.renderedPage.height,
      )
    ) {
      return this.createBlankTile(params.zoom, params.x, params.y);
    }

    const extractDimensions = this.calculateExtractDimensions(
      params.tileCoords,
      params.renderedPage.width,
      params.renderedPage.height,
    );

    if (!this.isValidExtractDimensions(extractDimensions)) {
      return this.createBlankTile();
    }

    return this.extractAndProcessTile(
      params.renderedPage.buffer,
      params.tileCoords,
      extractDimensions,
    );
  }

  private calculateTileCoordinates(
    x: number,
    y: number,
  ): { x: number; y: number } {
    return { x: x * TILE_SIZE, y: y * TILE_SIZE };
  }

  private isValidExtractDimensions(dimensions: {
    width: number;
    height: number;
  }): boolean {
    if (dimensions.width <= 0 || dimensions.height <= 0) {
      this.logger.warn(
        `🚫 Invalid extract dimensions - Width: ${dimensions.width}, Height: ${dimensions.height}`,
      );
      return false;
    }
    return true;
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

  private isTileOutOfBounds(
    tileCoords: { x: number; y: number },
    fullWidth: number,
    fullHeight: number,
  ): boolean {
    if (tileCoords.x >= fullWidth || tileCoords.y >= fullHeight) {
      this.logger.warn(
        `🚫 Tile completely out of bounds - Tile: [${tileCoords.x}, ${tileCoords.y}], Image: [${fullWidth}, ${fullHeight}]`,
      );
      return true;
    }
    return false;
  }

  private async createBlankTile(
    zoom?: number,
    x?: number,
    y?: number,
  ): Promise<Buffer> {
    const blankTile = await sharp({
      create: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .png()
      .toBuffer();

    if (zoom !== undefined && x !== undefined && y !== undefined) {
      this.logger.log(
        `✅ Blank Tile Generated - ${zoom}/${x}/${y}, Size: ${(blankTile.length / BYTES_PER_KB).toFixed(0)}KB`,
      );
    }
    return blankTile;
  }

  private calculateExtractDimensions(
    tileCoords: { x: number; y: number },
    fullWidth: number,
    fullHeight: number,
  ): { width: number; height: number } {
    const extractWidth = Math.min(
      TILE_SIZE,
      Math.max(0, fullWidth - tileCoords.x),
    );
    const extractHeight = Math.min(
      TILE_SIZE,
      Math.max(0, fullHeight - tileCoords.y),
    );

    this.logger.log(
      `✂️ Tile Extract - From: [${tileCoords.x}, ${tileCoords.y}], Size: ${extractWidth}x${extractHeight}, Image: ${fullWidth}x${fullHeight}`,
    );

    return { width: extractWidth, height: extractHeight };
  }

  private async extractAndProcessTile(
    imageBuffer: Buffer,
    tileCoords: { x: number; y: number },
    extractDimensions: { width: number; height: number },
  ): Promise<Buffer> {
    let tileImage = sharp(imageBuffer).extract({
      left: tileCoords.x,
      top: tileCoords.y,
      width: extractDimensions.width,
      height: extractDimensions.height,
    });

    if (
      extractDimensions.width < TILE_SIZE ||
      extractDimensions.height < TILE_SIZE
    ) {
      tileImage = tileImage.extend({
        top: 0,
        bottom: TILE_SIZE - extractDimensions.height,
        left: 0,
        right: TILE_SIZE - extractDimensions.width,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      });
    }

    return tileImage.png().toBuffer();
  }

  private logTileCompletion(params: {
    zoom: number;
    x: number;
    y: number;
    startTime: number;
    tileBuffer: Buffer;
  }): void {
    const { zoom, x, y, startTime, tileBuffer } = params;
    const totalTime = Date.now() - startTime;
    this.logger.log(
      `✅ Tile Complete - ${zoom}/${x}/${y}, Total: ${totalTime}ms, Size: ${(tileBuffer.length / BYTES_PER_KB).toFixed(0)}KB`,
    );
  }

  private handleTileError(params: {
    error: unknown;
    fileId: string;
    page: number;
    zoom: number;
    x: number;
    y: number;
  }): void {
    const { error, fileId, page, zoom, x, y } = params;
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
  }

  private async validatePdfFile(fileId: string): Promise<File> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId, is_deleted: false },
    });

    if (!file) {
      throw new FileNotFoundException(fileId);
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException(
        `File ${fileId} is not a PDF. Expected application/pdf, got ${file.mimetype}`,
      );
    }

    return file;
  }
}

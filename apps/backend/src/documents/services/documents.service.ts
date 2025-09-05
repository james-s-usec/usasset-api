import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AssetDocumentResponseDto } from '../dto/asset-document-response.dto';
import { File } from '@prisma/client';

type FileWithAsset = File & {
  asset: { name: string; assetTag: string } | null;
};

@Injectable()
export class DocumentsService {
  public constructor(private readonly prisma: PrismaService) {}

  public async findByAsset(
    assetId: string,
  ): Promise<AssetDocumentResponseDto[]> {
    const documents = await this.fetchDocumentsByAsset(assetId);
    return documents.map((doc) => this.mapToDto(doc));
  }

  private async fetchDocumentsByAsset(
    assetId: string,
  ): Promise<FileWithAsset[]> {
    return this.prisma.file.findMany({
      where: {
        asset_id: assetId,
        is_deleted: false,
      },
      include: {
        asset: {
          select: {
            name: true,
            assetTag: true,
          },
        },
      },
      orderBy: [{ file_type: 'asc' }, { created_at: 'desc' }],
    });
  }

  private mapToDto(doc: FileWithAsset): AssetDocumentResponseDto {
    return {
      id: doc.id,
      filename: doc.filename,
      original_name: doc.original_name,
      mimetype: doc.mimetype,
      size: doc.size,
      file_type: doc.file_type,
      asset_id: doc.asset_id!,
      asset_name: doc.asset?.name,
      asset_tag: doc.asset?.assetTag,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    };
  }

  public async getCompleteDocumentation(assetId: string): Promise<{
    documents: AssetDocumentResponseDto[];
    documentCount: number;
    documentsByType: Record<string, number>;
  }> {
    // First verify asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId, is_deleted: false },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    const documents = await this.findByAsset(assetId);

    // Calculate statistics
    const documentsByType = documents.reduce(
      (acc, doc) => {
        acc[doc.file_type] = (acc[doc.file_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      documents,
      documentCount: documents.length,
      documentsByType,
    };
  }
}

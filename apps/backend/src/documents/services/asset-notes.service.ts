import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface AssetNotesDto {
  note1Subject?: string | null;
  note1?: string | null;
  note2Subject?: string | null;
  note2?: string | null;
  note3Subject?: string | null;
  note3?: string | null;
  note4Subject?: string | null;
  note4?: string | null;
  note5Subject?: string | null;
  note5?: string | null;
  note6Subject?: string | null;
  note6?: string | null;
}

@Injectable()
export class AssetNotesService {
  public constructor(private readonly prisma: PrismaService) {}

  public async getAssetNotes(assetId: string): Promise<AssetNotesDto> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId, is_deleted: false },
      select: {
        note1Subject: true,
        note1: true,
        note2Subject: true,
        note2: true,
        note3Subject: true,
        note3: true,
        note4Subject: true,
        note4: true,
        note5Subject: true,
        note5: true,
        note6Subject: true,
        note6: true,
      },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    return asset;
  }

  public async updateAssetNotes(
    assetId: string,
    notes: AssetNotesDto,
  ): Promise<AssetNotesDto> {
    // Verify asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId, is_deleted: false },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    // Update notes
    const updatedAsset = await this.prisma.asset.update({
      where: { id: assetId },
      data: {
        ...(notes.note1Subject !== undefined && {
          note1Subject: notes.note1Subject,
        }),
        ...(notes.note1 !== undefined && { note1: notes.note1 }),
        ...(notes.note2Subject !== undefined && {
          note2Subject: notes.note2Subject,
        }),
        ...(notes.note2 !== undefined && { note2: notes.note2 }),
        ...(notes.note3Subject !== undefined && {
          note3Subject: notes.note3Subject,
        }),
        ...(notes.note3 !== undefined && { note3: notes.note3 }),
        ...(notes.note4Subject !== undefined && {
          note4Subject: notes.note4Subject,
        }),
        ...(notes.note4 !== undefined && { note4: notes.note4 }),
        ...(notes.note5Subject !== undefined && {
          note5Subject: notes.note5Subject,
        }),
        ...(notes.note5 !== undefined && { note5: notes.note5 }),
        ...(notes.note6Subject !== undefined && {
          note6Subject: notes.note6Subject,
        }),
        ...(notes.note6 !== undefined && { note6: notes.note6 }),
      },
      select: {
        note1Subject: true,
        note1: true,
        note2Subject: true,
        note2: true,
        note3Subject: true,
        note3: true,
        note4Subject: true,
        note4: true,
        note5Subject: true,
        note5: true,
        note6Subject: true,
        note6: true,
      },
    });

    return updatedAsset;
  }
}

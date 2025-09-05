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

  private buildNotesUpdateData(notes: AssetNotesDto): Record<string, any> {
    const data: Record<string, any> = {};
    const noteFields = [1, 2, 3, 4, 5, 6];

    noteFields.forEach((num) => {
      const subjectKey = `note${num}Subject` as keyof AssetNotesDto;
      const noteKey = `note${num}` as keyof AssetNotesDto;

      if (notes[subjectKey] !== undefined) {
        data[subjectKey] = notes[subjectKey];
      }
      if (notes[noteKey] !== undefined) {
        data[noteKey] = notes[noteKey];
      }
    });

    return data;
  }

  private getNoteSelectFields(): Record<string, boolean> {
    const fields: Record<string, boolean> = {};
    [1, 2, 3, 4, 5, 6].forEach((num) => {
      fields[`note${num}Subject`] = true;
      fields[`note${num}`] = true;
    });
    return fields;
  }

  public async updateAssetNotes(
    assetId: string,
    notes: AssetNotesDto,
  ): Promise<AssetNotesDto> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId, is_deleted: false },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    const updatedAsset = await this.prisma.asset.update({
      where: { id: assetId },
      data: this.buildNotesUpdateData(notes),
      select: this.getNoteSelectFields(),
    });

    return updatedAsset;
  }
}

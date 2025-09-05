import { Injectable, Logger } from '@nestjs/common';
import { AzureBlobStorageService } from '../../files/services/azure-blob-storage.service';

interface ParsedRow {
  [key: string]: string;
}

interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
  errors: string[];
}

@Injectable()
export class CsvParserService {
  private readonly logger = new Logger(CsvParserService.name);

  public constructor(
    private readonly blobStorageService: AzureBlobStorageService,
  ) {}

  /**
   * Simple CSV parser - just get it working
   */
  public async parseFileFromBlob(fileId: string): Promise<ParseResult> {
    try {
      const csvContent =
        await this.blobStorageService.getFileContentAsText(fileId);
      return this.parseCSV(csvContent);
    } catch (error) {
      this.logger.error(`Failed to parse CSV from blob ${fileId}:`, error);
      return {
        headers: [],
        rows: [],
        errors: [
          `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  // CODE_SMELL: [Rule #4] COMPLEXITY - Method has 31 lines, exceeds 30-line limit
  // TODO: Split into parseHeaders, parseDataRows, validateRowStructure methods
  private parseCSV(content: string): ParseResult {
    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    const errors: string[] = [];

    if (lines.length === 0) {
      return { headers: [], rows: [], errors: ['CSV file is empty'] };
    }

    // Parse headers
    const headers = this.parseLine(lines[0]);
    const rows: ParsedRow[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseLine(lines[i]);
      if (values.length !== headers.length) {
        errors.push(
          `Row ${i + 1}: Expected ${headers.length} columns but got ${values.length}`,
        );
        continue;
      }

      const row: ParsedRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return { headers, rows, errors };
  }

  private parseLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }
}

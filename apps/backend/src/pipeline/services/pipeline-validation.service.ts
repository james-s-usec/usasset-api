import { Injectable, Logger } from '@nestjs/common';
import { ProcessedRow } from '../interfaces/pipeline-types';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalRows: number;
    emptyRows: number;
    duplicateRows: number;
  };
}

interface RowValidation {
  row: ProcessedRow;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class PipelineValidationService {
  private readonly logger = new Logger(PipelineValidationService.name);

  public validateHeaders(
    headers: string[],
    requiredHeaders: string[],
  ): string[] {
    const errors: string[] = [];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    return errors;
  }

  public validateRow(row: ProcessedRow, index: number): RowValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for required fields
    const assetTag = row['Asset Tag'];
    if (!assetTag || !String(assetTag).trim()) {
      errors.push(`Row ${index}: Missing Asset Tag`);
    }

    const assetName = row['Asset Name'];
    if (!assetName || !String(assetName).trim()) {
      errors.push(`Row ${index}: Missing Asset Name`);
    }

    // Validate status if present
    if (row['Status']) {
      const validStatuses = [
        'ACTIVE',
        'INACTIVE',
        'MAINTENANCE',
        'DISPOSED',
        'PENDING',
        'RESERVED',
        'RETIRED',
      ];
      const status = String(row['Status']).toUpperCase();
      if (!validStatuses.includes(status)) {
        warnings.push(`Row ${index}: Invalid status '${row['Status']}'`);
      }
    }

    return { row, errors, warnings };
  }

  public validateDataConsistency(rows: ProcessedRow[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const assetTags = new Set<string>();
    let emptyRows = 0;
    let duplicateRows = 0;

    rows.forEach((row, index) => {
      // Check for empty rows
      const hasData = Object.values(row).some(
        (v) => v !== null && v !== undefined && String(v).trim() !== '',
      );
      if (!hasData) {
        emptyRows++;
        return;
      }

      // Check for duplicate asset tags
      const assetTagValue = row['Asset Tag'];
      const assetTag = assetTagValue ? String(assetTagValue).trim() : '';
      if (assetTag) {
        if (assetTags.has(assetTag)) {
          duplicateRows++;
          const ROW_OFFSET = 2;
          warnings.push(
            `Row ${index + ROW_OFFSET}: Duplicate Asset Tag '${assetTag}'`,
          );
        }
        assetTags.add(assetTag);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalRows: rows.length,
        emptyRows,
        duplicateRows,
      },
    };
  }

  public validateFileSize(sizeInBytes: number): string | null {
    const MB_IN_BYTES = 1024 * 1024;
    const MAX_SIZE_MB = 10;
    const MAX_SIZE = MAX_SIZE_MB * MB_IN_BYTES;
    if (sizeInBytes > MAX_SIZE) {
      return `File size exceeds maximum allowed size of 10MB`;
    }
    return null;
  }

  public validateFileType(mimeType: string): string | null {
    const allowedTypes = ['text/csv', 'application/csv'];
    if (!allowedTypes.includes(mimeType)) {
      return `Invalid file type. Only CSV files are allowed`;
    }
    return null;
  }
}

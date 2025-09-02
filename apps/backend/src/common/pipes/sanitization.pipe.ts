import { PipeTransform, Injectable } from '@nestjs/common';

/**
 * Basic XSS protection pipe that sanitizes input strings
 * - Trims whitespace
 * - Removes angle brackets to prevent HTML injection
 *
 * This follows YAGNI - just basic protection, no complex sanitization
 */
@Injectable()
export class SanitizationPipe implements PipeTransform {
  public transform(value: unknown): unknown {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (this.isPlainObject(value)) {
      return this.sanitizeObject(value as Record<string, unknown>);
    }

    if (Array.isArray(value)) {
      return this.sanitizeArray(value);
    }

    return value;
  }

  private sanitizeString(value: string): string {
    return value.trim().replace(/[<>]/g, '');
  }

  private isPlainObject(value: unknown): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private sanitizeObject(
    obj: Record<string, unknown>,
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = this.transform(obj[key]);
      }
    }
    return sanitized;
  }

  private sanitizeArray(arr: unknown[]): unknown[] {
    return arr.map((item) => this.transform(item));
  }
}

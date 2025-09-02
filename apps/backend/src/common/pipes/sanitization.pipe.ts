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
    // Handle string values
    if (typeof value === 'string') {
      // Basic sanitization: trim and remove angle brackets
      return value.trim().replace(/[<>]/g, '');
    }

    // Handle objects recursively
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const sanitized: Record<string, unknown> = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          sanitized[key] = this.transform((value as Record<string, unknown>)[key]);
        }
      }
      return sanitized;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => this.transform(item));
    }

    // Return other types unchanged
    return value;
  }
}

import { v4 as uuidv4 } from 'uuid';

export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const CORRELATION_ID_STORAGE_KEY = 'correlation-id';

export class CorrelationIdService {
  private static currentId: string | null = null;

  public static generate(): string {
    const correlationId = uuidv4();
    this.currentId = correlationId;
    sessionStorage.setItem(CORRELATION_ID_STORAGE_KEY, correlationId);
    return correlationId;
  }

  public static get(): string {
    if (this.currentId) {
      return this.currentId;
    }

    const stored = sessionStorage.getItem(CORRELATION_ID_STORAGE_KEY);
    if (stored) {
      this.currentId = stored;
      return stored;
    }

    return this.generate();
  }

  public static set(correlationId: string): void {
    this.currentId = correlationId;
    sessionStorage.setItem(CORRELATION_ID_STORAGE_KEY, correlationId);
  }

  public static clear(): void {
    this.currentId = null;
    sessionStorage.removeItem(CORRELATION_ID_STORAGE_KEY);
  }

  public static getHeaders(): Record<string, string> {
    return {
      [CORRELATION_ID_HEADER]: this.get(),
    };
  }
}
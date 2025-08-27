import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  private readonly envVars: NodeJS.ProcessEnv;

  constructor() {
    this.envVars = process.env;
  }

  get(key: string): string | undefined {
    return this.envVars[key];
  }

  getOrThrow(key: string): string {
    const value = this.get(key);
    if (!value) {
      throw new Error(`Configuration key "${key}" is not defined`);
    }
    return value;
  }

  getNumber(key: string, defaultValue: number): number {
    const value = this.get(key);
    const parsed = value ? parseInt(value, 10) : defaultValue;
    return isNaN(parsed) ? defaultValue : parsed;
  }

  getBoolean(key: string, defaultValue: boolean): boolean {
    const value = this.get(key);
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  get port(): number {
    return this.getNumber('PORT', 3000);
  }

  get nodeEnv(): string {
    return this.get('NODE_ENV') || 'development';
  }

  get databaseUrl(): string | undefined {
    return this.get('DATABASE_URL');
  }

  get corsOrigin(): string {
    return this.get('CORS_ORIGIN') || '*';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
}

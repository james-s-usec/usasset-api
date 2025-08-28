import { validationSchema } from './env.validation';
import { DEFAULT_TEST_PORT } from '../common/constants';

interface ValidatedConfig {
  NODE_ENV: string;
  PORT: number;
  CORS_ORIGIN: string;
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  API_KEY?: string;
}

// Test data helpers
function getDevConfig(): Record<string, unknown> {
  return {
    NODE_ENV: 'development',
    PORT: 3000,
    CORS_ORIGIN: 'http://localhost:5173',
  };
}

function getProdConfig(): Record<string, unknown> {
  return {
    NODE_ENV: 'production',
    PORT: DEFAULT_TEST_PORT,
    DATABASE_URL: 'postgresql://server.postgres.database.azure.com/usasset',
    CORS_ORIGIN: 'https://frontend.azurecontainerapps.io',
    JWT_SECRET: 'from-key-vault',
  };
}

function getAzureConfig(): Record<string, unknown> {
  return {
    NODE_ENV: 'production',
    PORT: DEFAULT_TEST_PORT.toString(), // Azure provides PORT as string
    DATABASE_URL:
      'postgresql://dbadmin@usasset-db.postgres.database.azure.com/usasset?sslmode=require',
    CORS_ORIGIN: 'https://frontend.azurecontainerapps.io',
    JWT_SECRET: 'secretref:jwt-secret', // Key Vault reference
    API_KEY: 'secretref:api-key', // Key Vault reference
  };
}

// Validation helpers
function validateConfig(
  config: Record<string, unknown>,
): ReturnType<typeof validationSchema.validate> {
  return validationSchema.validate(config);
}

function expectValidConfig(config: Record<string, unknown>): void {
  const { error } = validateConfig(config);
  expect(error).toBeUndefined();
}

function expectInvalidConfig(
  config: Record<string, unknown>,
  expectedMessage: string,
): void {
  const { error } = validateConfig(config);
  expect(error).toBeDefined();
  expect(error?.message).toContain(expectedMessage);
}

describe('Environment Validation', () => {
  describe('Development Environment', () => {
    it('should validate development config', () => {
      expectValidConfig(getDevConfig());
    });
  });

  describe('Production Environment', () => {
    it('should validate production config with required fields', () => {
      expectValidConfig(getProdConfig());
    });

    it('should validate Azure Container Apps with Key Vault secrets', () => {
      const result = validateConfig(getAzureConfig());
      expect(result.error).toBeUndefined();
      expect((result.value as ValidatedConfig).PORT).toBe(DEFAULT_TEST_PORT);
    });

    it('should fail without DATABASE_URL in production', () => {
      const config = { NODE_ENV: 'production', JWT_SECRET: 'secret' };
      expectInvalidConfig(config, 'DATABASE_URL');
    });

    it('should fail without JWT_SECRET in production', () => {
      const config = {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://localhost/db',
      };
      expectInvalidConfig(config, 'JWT_SECRET');
    });
  });
});

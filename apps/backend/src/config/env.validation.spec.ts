import { validationSchema } from './env.validation';

describe('Environment Validation', () => {
  describe('Development Environment', () => {
    it('should validate development config', () => {
      const config = {
        NODE_ENV: 'development',
        PORT: 3000,
        CORS_ORIGIN: 'http://localhost:5173',
      };
      
      const { error } = validationSchema.validate(config);
      expect(error).toBeUndefined();
    });
  });

  describe('Production Environment', () => {
    it('should validate production config with required fields', () => {
      const config = {
        NODE_ENV: 'production',
        PORT: 8080,
        DATABASE_URL: 'postgresql://server.postgres.database.azure.com/usasset',
        CORS_ORIGIN: 'https://frontend.azurecontainerapps.io',
        JWT_SECRET: 'from-key-vault',
      };
      
      const { error } = validationSchema.validate(config);
      expect(error).toBeUndefined();
    });

    it('should validate Azure Container Apps with Key Vault secrets', () => {
      // Simulating what Azure Container Apps injects from Key Vault
      const config = {
        NODE_ENV: 'production',
        PORT: '8080', // Azure provides PORT as string
        DATABASE_URL: 'postgresql://dbadmin@usasset-db-yf2eqktewmxp2.postgres.database.azure.com/usasset?sslmode=require',
        CORS_ORIGIN: 'https://frontend-yf2eqktewmxp2.azurecontainerapps.io',
        JWT_SECRET: 'secretref:jwt-secret', // Key Vault reference
        API_KEY: 'secretref:api-key', // Key Vault reference
      };
      
      const { error, value } = validationSchema.validate(config);
      expect(error).toBeUndefined();
      expect(value.PORT).toBe(8080); // Should convert string to number
    });

    it('should fail without DATABASE_URL in production', () => {
      const config = {
        NODE_ENV: 'production',
        JWT_SECRET: 'secret',
      };
      
      const { error } = validationSchema.validate(config);
      expect(error).toBeDefined();
      expect(error?.message).toContain('DATABASE_URL');
    });

    it('should fail without JWT_SECRET in production', () => {
      const config = {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://server/db',
      };
      
      const { error } = validationSchema.validate(config);
      expect(error).toBeDefined();
      expect(error?.message).toContain('JWT_SECRET');
    });
  });
});
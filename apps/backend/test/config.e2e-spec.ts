import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('Configuration E2E', () => {
  let app: INestApplication;

  describe('Development Configuration', () => {
    beforeAll(async () => {
      // Set development environment
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3001';
      
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should start app with development config', () => {
      expect(app).toBeDefined();
    });
  });

  describe('Production Configuration', () => {
    it('should fail to start without required production variables', async () => {
      // Set production environment without required vars
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URL;
      delete process.env.JWT_SECRET;

      try {
        const moduleFixture: TestingModule = await Test.createTestingModule({
          imports: [AppModule],
        }).compile();
        
        const testApp = moduleFixture.createNestApplication();
        await testApp.init();
        
        // Should not reach here
        fail('App should have failed to start without required production config');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain('Validation failed');
      }
    });
  });
});